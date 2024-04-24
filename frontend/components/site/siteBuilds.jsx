import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link, useParams } from 'react-router-dom';

import GitHubLink from '../GitHubLink';
import buildActions from '../../actions/buildActions';
import { currentSite } from '../../selectors/site';
import LoadingIndicator from '../LoadingIndicator';
import RefreshBuildsButton from './refreshBuildsButton';
import {
  dateAndTimeSimple,
  duration,
  timeFrom,
  dateAndTime,
} from '../../util/datetime';
import AlertBanner from '../alertBanner';
import CreateBuildLink from '../CreateBuildLink';
import BranchViewLink from '../branchViewLink';
import {
  IconCheckCircle, IconClock, IconExclamationCircle, IconExperiment, IconSpinner, IconX,
} from '../icons';
import { getOrgById } from '../../selectors/organization';
import { sandboxMsg } from '../../util';

export const REFRESH_INTERVAL = 15 * 1000;

const buildStateData = ({ state, error }) => {
  let messageDoneIcon;
  switch (state) {
    case 'error':
      messageDoneIcon = {
        message: error === 'The build timed out' ? 'Timed out' : 'Failed',
        done: true,
        icon: IconExclamationCircle,
      };
      break;
    case 'processing':
      messageDoneIcon = { message: 'In progress', done: false, icon: IconSpinner };
      break;
    case 'skipped':
      messageDoneIcon = { message: 'Skipped', done: true, icon: IconX };
      break;
    case 'queued':
    case 'tasked':
    case 'created':
      messageDoneIcon = { message: 'Queued', done: false, icon: IconClock };
      break;
    case 'success':
      messageDoneIcon = { message: 'Completed', done: true, icon: IconCheckCircle };
      break;
    default:
      messageDoneIcon = { message: state, done: null, icon: null };
  }
  return messageDoneIcon;
};

function buildLogsLink(build, cta = 'View build logs') {
  return <Link className="build-info-logs-link" to={`/sites/${build.site.id}/builds/${build.id}/logs`}>{cta}</Link>;
}

function scansDocsLink(url, cta = 'What’s this?') {
  return <Link className="usa-link" target="_blank" to={url}>{cta}</Link>;
}

function shaLink(build) {
  const { owner, repository } = build.site;
  const sha = build.clonedCommitSha || build.requestedCommitSha;
  if (sha) {
    return (
      <GitHubLink
        owner={owner}
        repository={repository}
        sha={sha}
        branch={null}
        text={sha.slice(0, 7)}
        icon="sha"
      />
    );
  }
  return null;
}

function branchLink(build) {
  const { owner, repository } = build.site;

  return (
    <GitHubLink
      owner={owner}
      repository={repository}
      sha={null}
      branch={build.branch}
      text={build.branch}
      icon="branch"
    />
  );
}

function summarizeTaskResults(build) {
  const tasksSucceeded = build.BuildTasks.filter(task => task.status === 'success');
  const tasksIncomplete = build.BuildTasks.filter(task => task.status !== 'success' && task !== 'error' && task !== 'cancelled');
  const anyTaskErrored = build.BuildTasks.find(task => task.status === 'error');
  // currently if one is cancelled, they all are cancelled
  const tasksCancelled = build.BuildTasks.find(task => task.status === 'cancelled');

  function totalResults(results) {
    return (
      <>
        {' ('}
        <Link className="result-link" to={`/sites/${build.site.id}/builds/${build.id}/scans`}>
          { results.reduce((acc, task) => acc + task.count, 0) }
          {' '}
          issues found
        </Link>
        {') '}
      </>
    );
  }
  // if all tasks succeeded, show # complete and any results
  // if all tasks incomplete, show # complete out of total, and no results
  // if some complete, some succeeded, show # complete out of total, and any results

  if (tasksCancelled) {
    return (
      <div className="label-new">
        <IconX />
        <b>Scans cancelled. </b>
        Failed builds cannot be scanned.
      </div>
    );
  }
  if (anyTaskErrored) {
    return (
      <div className="label-warning">
        <IconExclamationCircle />
        One or more scans failed.
        {' '}
        <Link className="result-link" to={`/sites/${build.site.id}/builds/${build.id}/scans`}>Results</Link>
        {' '}
        may be incomplete.
      </div>
    );
  }
  return !anyTaskErrored?.length > 0 && (
    <div>
      <b className="label-new">
        <IconExperiment />
        Public beta:
      </b>
      {(tasksIncomplete.length > 0) && (
        <>
          {tasksSucceeded.length}
          {' '}
          of
          {' '}
        </>
      )}
      {build.BuildTasks.length}
      {' '}
      scans completed.
      {' '}
      {(tasksSucceeded.length > 0) && totalResults(tasksSucceeded)}
      (
      {scansDocsLink('https://cloud.gov/pages/documentation/build-scans/')}
      )
    </div>
  );
}

function buildHasBuildTasks(build) {
  return process.env.FEATURE_BUILD_TASKS === 'active' && build.BuildTasks?.length > 0;
}
function siteHasBuildTasks({ data, isLoading }) {
  return process.env.FEATURE_BUILD_TASKS === 'active' && !isLoading && data.some(build => build.BuildTasks?.length);
}

function latestBuildByBranch(builds) {
  const maxBuilds = {};
  const branchNames = [...new Set(builds.map(item => item.branch))];
  branchNames.forEach((branchName) => {
    let successes = builds.filter(b => b.branch === branchName && b.state === 'success');
    successes = successes.sort((a, b) => (new Date(b.completedAt) - new Date(a.completedAt)));
    if (successes.length > 0) {
      maxBuilds[branchName] = successes[0].id;
    }
  });
  return maxBuilds;
}

function SiteBuilds() {
  const { id } = useParams();
  const [autoRefresh, setAutoRefresh] = useState(false);
  const site = useSelector(state => currentSite(state.sites, id));
  const organization = useSelector(state => getOrgById(state.organizations, site.organizationId));
  const builds = useSelector(state => state.builds);

  let intervalHandle;
  useEffect(() => {
    buildActions.fetchBuilds({ id });
    intervalHandle = setInterval(() => {
      if (autoRefresh) {
        buildActions.fetchBuilds({ id });
      }
    }, REFRESH_INTERVAL);
    return () => {
      clearInterval(intervalHandle);
    };
  }, []);

  if (!builds.isLoading && !builds.data.length) {
    const header = 'This site does not yet have any builds.';
    const message = 'If this site was just added, the first build should be available within a few minutes.';
    return (
      <AlertBanner status="info" header={header} message={message}>
        <RefreshBuildsButton site={site} />
      </AlertBanner>
    );
  }
  const previewBuilds = builds.data && latestBuildByBranch(builds.data);
  return (
    <div>
      <div className="well">
        { organization?.isSandbox
          && (
          <AlertBanner
            status="warning"
            message={sandboxMsg(organization.daysUntilSandboxCleaning, 'site builds')}
            alertRole={false}
          />
          )}
      </div>
      <div className="log-tools">
        <div>
          {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
          <a
            href="#"
            role="button"
            onClick={() => setAutoRefresh(!autoRefresh)}
            data-test="toggle-auto-refresh"
          >
            Auto Refresh:
            {' '}
            <b>{autoRefresh ? 'ON' : 'OFF'}</b>
          </a>
          <RefreshBuildsButton site={site} />
        </div>
      </div>
      { builds.isLoading
        ? <LoadingIndicator />
        : (
          <div className="table-container">
            <table
              className="usa-table-borderless log-table log-table__site-builds table-full-width"
            >
              <thead>
                <tr>
                  <th scope="col">Build</th>
                  <th scope="col">Branch</th>
                  <th scope="col">Actions</th>
                  { siteHasBuildTasks(builds) && (
                    <th className="usa-sr-only" scope="col">Scans</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {builds.data.map((build) => {
                  const { message, done, icon } = buildStateData(build);

                  return (
                    <tr key={build.id} className={buildHasBuildTasks(build) ? 'build-has-scans' : ''}>
                      <th scope="row" data-title="Build">
                        <div className="build-info">
                          <div className="build-info-prefix">
                            #
                            { build.id }
                          </div>
                          <div className="build-info-details">
                            <h3 className="build-info-status">
                              { icon && (
                                <span className="build-info-inline-icon">
                                  { React.createElement(icon) }
                                </span>
                              )}
                              { message }
                            </h3>
                            {build.startedAt && (
                              <p>
                                Started
                                {' '}
                                <span title={dateAndTimeSimple(build.startedAt)}>
                                  { timeFrom(build.startedAt) }
                                </span>
                              </p>
                            )}
                            <p>
                              { (done && !!build.startedAt) && (
                                <>
                                  {message}
                                  {' '}
                                  after
                                  {' '}
                                  { duration(build.startedAt, build.completedAt) }
                                </>
                              )}
                              {(!done) && (
                                <>
                                  {message}
                                  {' '}
                                  for
                                  {' '}
                                  { duration(build.createdAt, build.completedAt) }
                                </>
                              )}
                              <br />
                              {build.startedAt ? buildLogsLink(build) : ''}

                            </p>
                          </div>
                        </div>

                      </th>
                      <td data-title="Branch">
                        <div className="branch-info">
                          { branchLink(build) }
                          <div className="commit-info">
                            { shaLink(build) }
                            <span className="commit-user" title={build.user?.email}>
                              { build.username }
                            </span>
                            <span className="commit-time" title={dateAndTime(build.createdAt)}>
                              { timeFrom(build.createdAt) }
                            </span>
                          </div>
                        </div>
                      </td>
                      <td data-title="Actions" className="table-actions">
                        <div>
                          { previewBuilds[build.branch] === build.id && build.state === 'success'
                          && (
                          <BranchViewLink
                            branchName={build.branch}
                            site={site}
                            showIcon
                            completedAt={build.completedAt}
                          />
                          ) }
                        </div>
                        <span>
                          {
                            ['error', 'success'].includes(build.state)
                            && (
                              <CreateBuildLink
                                handlerParams={{ buildId: build.id, siteId: site.id }}
                                handleClick={buildActions.restartBuild}
                                className="usa-button small-button rebuild-button"
                              >
                                Rebuild
                              </CreateBuildLink>
                            )
                          }
                        </span>
                      </td>
                      { siteHasBuildTasks(builds) && (
                        buildHasBuildTasks(build)
                          ? (
                            <td data-title="Scans" className="scan-results-pseudo-row">
                              { summarizeTaskResults(build) }
                            </td>
                          )
                          : (
                            <td className="no-scan-results usa-sr-only">No scans for this build</td>
                          )
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
            { builds.data.length >= 100
              ? <p>List only displays 100 most recent builds.</p>
              : null }
          </div>
        )}
    </div>
  );
}

export { SiteBuilds };
export default SiteBuilds;
