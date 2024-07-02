import React from 'react';
import PropTypes from 'prop-types';
import { SITE } from './../../propTypes';
import { Link, useParams } from 'react-router-dom';

import {
  dateAndTimeSimple,
  duration,
  timeFrom,
  dateAndTime,
} from '../../util/datetime';
import buildActions from '../../actions/buildActions';

import GitHubLink from '../GitHubLink';
import CreateBuildLink from '../CreateBuildLink';
import CreateScanLink from '../CreateScanLink';
import BranchViewLink from '../branchViewLink';
import {
  IconCheckCircle, 
  IconClock, 
  IconExclamationCircle, 
  IconExperiment, 
  IconSpinner, 
  IconX,
} from '../icons';
import ScanResultsSummary from '../ScanResultsSummary';
import api from '../../util/federalistApi';



export const SiteBuildsBuild = ({ build, previewBuilds, showBuildTasks, site}) => {
  const siteId = site.id;

  const {
    awsBucketName, owner, repository, domains, siteBranchConfigs,
  } = site;

  const buildStateData = ({ state, error }) => {
    let messageStatusDoneIcon;
    switch (state) {
      case 'error':
        messageStatusDoneIcon = {
          message: error,
          status: error === 'The build timed out' ? 'Timed out' : 'Failed',
          done: true,
          icon: IconExclamationCircle,
        };
        break;
      case 'processing':
        messageStatusDoneIcon = { 
          message: 'in progress', 
          status: 'In progress', 
          done: false, 
          icon: IconSpinner 
        };
        break;
      case 'skipped':
        messageStatusDoneIcon = { 
          message: 'skipped', 
          status: 'Skipped', 
          done: true, 
          icon: IconX 
        };
        break;
      case 'queued':
      case 'tasked':
      case 'created':
        messageStatusDoneIcon = { 
          message: 'in queue', 
          status: 'Queued', 
          done: false, icon: 
          IconClock 
        };
        break;
      case 'success':
        messageStatusDoneIcon = { 
          message: 'done',
          status: 'Complete',
          done: true, 
          icon: IconCheckCircle 
        };
        break;
      default:
        messageStatusDoneIcon = { 
          message: state, 
          status: state, 
          done: null, 
          icon: null 
        };
    }
    return messageStatusDoneIcon;
  };
  
  const { message, status, done, icon } = buildStateData(build);


  function isPreviewBuild() { return (previewBuilds[build.branch] === build.id) };

  function buildLogsLink(buildId) {
    const cta = 'View logs'
    return <Link className="build-info-logs-link" to={`/sites/${siteId}/builds/${buildId}/logs`}>{cta}</Link>;
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

  let summarizeTaskResults = (build => {
    const anyTaskErrored = build.BuildTasks.find(task => task.status === 'error');
    const anyTasksCancelled = build.BuildTasks.find(task => task.status === 'cancelled');    
    const anyTasksProcessing = build.BuildTasks.find(task => task.status === 'processing');    
    const whichTasksSucceeded = build.BuildTasks.filter(task => task.status === 'success');
    const allTasksComplete = build.BuildTasks.every(task => task.status === 'success' 
    || task == 'error' && task == 'cancelled');


    function totalResults(results) {
      return (results.reduce((acc, task) => acc + task.count, 0)
      );
    }
    if (anyTaskErrored) {
      return {status: 'error' };
    }
    if (anyTasksProcessing) {
      return { status: 'processing' };
    }
    if (allTasksComplete){
      return {status: 'success', count: totalResults(whichTasksSucceeded)}
    };
    if (anyTasksCancelled) {
      return {status: 'cancelled' };
    }
    return { status: 'queued'}
  })

  function buildHasBuildTasks(build) {
    return process.env.FEATURE_BUILD_TASKS === 'active' && build.BuildTasks?.length > 0;
  }

  function scan(build) {
    return api.runScansForBuild(build.id).then(() => {
      // TODO: optionally refresh or something?
    });
  }

  function showAllForSite() {
    return `${awsBucketName}, ${owner}, ${repository}, ${domains}, ${siteBranchConfigs},`
  }
  return (
    <tr className={buildHasBuildTasks(build) ? 'build-has-scans' : ''}>
      <th scope="row" data-title="Build">
        <div className="status-info">
          <h3 className="status-info-title">
              { icon && (
                <span className="status-info-inline-icon">
                  { React.createElement(icon) }
                </span>
              )}
              { status }
            </h3>
          </div>
          <div className="build-info-details">
            <p>
              Build #{build.id}
              { (done && !!build.startedAt) && (
                <>
                  {' '}
                  ran for
                  {' '}
                  { duration(build.startedAt, build.completedAt) }
                </>
              )}
              {(!done) && (
                <>
                  {' '}
                  {message}
                  {' '}
                  for
                  {' '}
                  { duration(build.createdAt, build.completedAt) }
                </>
              )}
            </p>
            {build.startedAt && !!done && (
              <p>
                <span title={dateAndTimeSimple(build.startedAt)}>
                  { timeFrom(build.startedAt) }
                </span>
              </p>
            )}
            <p className="build-info-id">
              {build.startedAt ? buildLogsLink(build.id) : ''}
            </p>
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
      { showBuildTasks && (
        buildHasBuildTasks(build)
          ? (
            <td data-title="Scans" className="">
              <ScanResultsSummary {...summarizeTaskResults(build)}>
                { summarizeTaskResults(build)?.status !== 'cancelled' && summarizeTaskResults(build)?.status !== 'queued' && (
                  <>
                    <Link to={`/sites/${siteId}/builds/${build.id}/scans`}>View scans</Link>
                  </>
                )}
              </ScanResultsSummary>
            </td>
          )
          : (
            <td className="no-scan-results">
                <ScanResultsSummary status="cancelled" />
            </td>
          )
      )}
      <td data-title="Actions" className="table-actions">
        { isPreviewBuild() && build.state === 'success'
          && (
            <span class="table-actions_buttons">

              <BranchViewLink
                branchName={build.branch}
                site={build.site}
                showIcon
                completedAt={build.completedAt}
              />
            </span>
          )
        }
        { ['error', 'success'].includes(build.state)
          && (
            <span class="table-actions_buttons">
              <CreateBuildLink
                handlerParams={{ buildId: build.id, siteId }}
                handleClick={buildActions.restartBuild}
                className="usa-button small-button rebuild-button"
              >
                Rebuild
              </CreateBuildLink>
            </span>
          )
        }
        { isPreviewBuild() && build.state === 'success'
          && (
            <span class="table-actions_buttons">
              <CreateScanLink
                handlerParams={build}
                handleClick={() => scan(build)}
                className="usa-button usa-button-secondary small-button"
              >
                Scan site
              </CreateScanLink>
            </span>
          ) 
        }
      </td>
      
    </tr>
  );


}

SiteBuildsBuild.propTypes = {
  build: PropTypes.object.isRequired,
  previewBuilds: PropTypes.object.isRequired,
  showBuildTasks: PropTypes.bool,
  site: SITE.isRequired
};
SiteBuildsBuild.defaultProps = {
  showBuildTasks: false,
}

export default SiteBuildsBuild;
