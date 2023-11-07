import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link, useParams } from 'react-router-dom';

import GitHubLink from '../GitHubLink';
import buildActions from '../../actions/buildActions';
import { currentSite } from '../../selectors/site';
import LoadingIndicator from '../LoadingIndicator';
import RefreshBuildsButton from './refreshBuildsButton';
import { duration, timeFrom, dateAndTime } from '../../util/datetime';
import AlertBanner from '../alertBanner';
import CreateBuildLink from '../CreateBuildLink';
import BranchViewLink from '../branchViewLink';
import {
  IconCheckCircle, IconClock, IconExclamationCircle, IconSpinner,
} from '../icons';
import { getOrgById } from '../../selectors/organization';
import { sandboxMsg } from '../../util';

export const REFRESH_INTERVAL = 15 * 1000;

// for now, get this value per build from API
let result = { state: "error"}

const buildStateData = ({ state, error }) => {
  let messageIcon;
  switch (state) {
    case 'error':
      messageIcon = {
        message: error === 'The build timed out' ? 'Timed out' : 'Failed',
        icon: IconExclamationCircle,
      };
      break;
    case 'processing':
      messageIcon = { message: 'In progress', icon: IconSpinner };
      break;
    case 'skipped':
      messageIcon = { message: 'Skipped', icon: null };
      break;
    case 'queued':
    case 'created':
      messageIcon = { message: 'Queued', icon: IconClock };
      break;
    case 'success':
      messageIcon = { message: 'Completed', icon: IconCheckCircle };
      break;
    default:
      messageIcon = { message: state, icon: null };
  }
  return messageIcon;
};

function buildLogsLink(build) {
  return <Link className="result-link" to={`/sites/${build.site.id}/builds/${build.id}/logs`}>View build logs</Link>;
}
function resultLink(build) {
  return <Link className="result-link" to={`/sites/${build.site.id}/builds/${build.id}/scans`}>View scan results</Link>;
}

function shaLink(build) {
  const { owner, repository } = build.site;

  return (
    <GitHubLink
      owner={owner}
      repository={repository}
      sha={build.clonedCommitSha}
      branch={null}
      text={build.clonedCommitSha.slice(0,6)}
      icon="sha"
    />
  );
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
                  <th scope="col">Results</th>
                  <th scope="col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {builds.data.map((build) => {
                  const { message, icon } = buildStateData(build);

                  return (
                    <tr key={build.id}>
                      <th scope="row" data-title="Build">
                        <div className="build-info">
                          <div className="build-info-icon">
                            { icon && React.createElement(icon) }
                          </div>
                          <div className="build-info-details">
                            <h3 className="build-info-status">{ message }</h3>
                            <p>Build <b>#{ build.id }</b></p>
                          </div>
                        </div>
                        
                      </th>
                      <td data-title="Branch">
                        <div className="branch-info">
                          { branchLink(build) }
                          <div className="commit-info">
                            {/* <span className="commit-sha" title={("Full Sha: ") + build.clonedCommitSha}>{build.clonedCommitSha}</span> */}
                            { shaLink(build) }
                            <span className="commit-user" title={build.user.email}>{ build.username }</span>
                            <span className="commit-time" title={dateAndTime(build.createdAt)}>{ timeFrom(build.createdAt) }</span>
                          </div>
                        </div>
                      </td>
                      <td data-title="Results">
                        <ul className="results-list unstyled-list">
                          <li className="result-item">
                            { buildLogsLink(build) }
                            <span> ({ duration(build.startedAt, build.completedAt) })</span>
                          </li>
                          <li className="result-item">
                            { result.state && result.state === 'success' && resultLink(build) }
                            {['created', 'queued', 'in progress', 'error'].includes(result.state) && (
                               <span>WIP: Scan {result.state}</span>
                            )
                            }
                          </li>
                        </ul>
                      </td >
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
                            className="usa-button rebuild-button"
                          >
                            Rebuild
                          </CreateBuildLink>
                          )
                        }
                        </span>
                      </td>
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
