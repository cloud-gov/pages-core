import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { SITE, BUILD } from '../../propTypes';
import { useScannableBuild } from '../../hooks/useScannableBuild';
import {
  dateAndTimeSimple,
  duration,
  timeFrom,
} from '../../util/datetime';
import buildActions from '../../actions/buildActions';

import GithubBuildBranchLink from '../GithubBuildBranchLink';
import GithubBuildShaLink from '../GithubBuildShaLink';
import CreateBuildLink from '../CreateBuildLink';
import CreateScanLink from '../CreateScanLink';
import BranchViewLink from '../branchViewLink';
import {
  IconCheckCircle,
  IconClock,
  IconExclamationCircle,
  IconSpinner,
  IconX,
  IconRebuild,
  IconReport,
} from '../icons';

function BuildLogsLink({ buildId, siteId }) {
  const cta = 'View build logs';
  return <Link to={`/sites/${siteId}/builds/${buildId}/logs`}>{cta}</Link>;
}

BuildLogsLink.propTypes = {
  buildId: PropTypes.number.isRequired,
  siteId: PropTypes.number.isRequired,
};

export const SiteBuildsBuild = ({
  build: initBuild,
  previewBuilds: initPreviewBuilds,
  showBuildTasks: initShowBuildTasks,
  site,
}) => {
  const siteId = site.id;
  const {
    build,
    buildHasBuildTasks,
    isPreviewBuild,
    isScannableBuild,
    isScanActionDisabled,
    startScan,
  } = useScannableBuild(initBuild, initPreviewBuilds, initShowBuildTasks);

  const buildStateData = ({ state, error }) => {
    let messageStatusDoneIcon;
    switch (state) {
      case 'error':
        messageStatusDoneIcon = {
          messagePrefix: 'Failed in ',
          status: error === 'The build timed out' ? 'Timed out' : 'Failed',
          done: true,
          icon: IconExclamationCircle,
        };
        break;
      case 'processing':
        messageStatusDoneIcon = {
          messagePrefix: 'In progress for ',
          status: 'In progress',
          done: false,
          icon: IconSpinner,
        };
        break;
      case 'skipped':
        messageStatusDoneIcon = {
          messagePrefix: 'Skipped',
          status: 'Skipped',
          done: true,
          icon: IconX,
        };
        break;
      case 'queued':
      case 'tasked':
      case 'created':
        messageStatusDoneIcon = {
          messagePrefix: 'In queue for ',
          status: 'Queued',
          done: false,
          icon: IconClock,
        };
        break;
      case 'success':
        messageStatusDoneIcon = {
          messagePrefix: 'Done in ',
          status: 'Completed',
          done: true,
          icon: IconCheckCircle,
        };
        break;
      default:
        messageStatusDoneIcon = {
          messagePrefix: state,
          status: state,
          done: null,
          icon: null,
        };
    }
    return messageStatusDoneIcon;
  };

  const {
    messagePrefix,
    status: buildStatus,
    done,
    icon,
  } = buildStateData(build);

  return (
    <tr
      aria-labelledby={`build-${build.id}`}
      className={isPreviewBuild ? 'is-preview-build' : ''}
    >
      <th scope="row" data-title="Build">
        <div className="build-info">
          <div className="build-info-prefix">
            #
            {build.id}
          </div>
          <div className="build-info-details">
            <div className="status-info">
              <h3 className="status-info-title">
                {icon && (
                  <span className="status-info-inline-icon">
                    {React.createElement(icon)}
                  </span>
                )}
                {buildStatus}
              </h3>
            </div>
            <span id={`build-${build.id}`} className="usa-sr-only">
              Build #
              {build.id}
            </span>
            {build.startedAt && !!done && (
              <p>
                Finished
                {' '}
                <span title={dateAndTimeSimple(build.startedAt)}>
                  {timeFrom(build.startedAt)}
                </span>
              </p>
            )}
            <p>
              {done && !!build.startedAt && (
                <>
                  {messagePrefix}

                  {duration(build.startedAt, build.completedAt)}
                </>
              )}
              {!done && (
                <>
                  {messagePrefix}

                  {duration(build.createdAt, build.completedAt)}
                </>
              )}
            </p>

            <p className="logs-link">
              {build.startedAt && (
                <BuildLogsLink buildId={build.id} siteId={siteId} />
              )}
            </p>
          </div>
        </div>
      </th>
      <td data-title="Branch">
        <div className="branch-info">
          <GithubBuildBranchLink build={build} site={site} />
          <div className="commit-info">
            <GithubBuildShaLink build={build} site={site} />
            <span className="commit-user" title={build.user?.email}>
              {build.username}
            </span>
          </div>
        </div>

      </td>
      { initShowBuildTasks && (
        <td data-title="Reports">
          {build.BuildTasks?.length > 0 && (
            <p className="scan-link">
              <Link to={`/sites/${siteId}/reports?build=${build.id}`}>
                View reports
              </Link>
            </p>
          )}
          {isScannableBuild && (
            <CreateScanLink
              className="usa-button usa-button-secondary small-button"
              isDisabled={isScanActionDisabled}
              handleClick={() => startScan(build.id)}
            >
              {buildHasBuildTasks ? (
                <>
                  <IconRebuild />
                  Rerun report
                </>
              ) : (
                <>
                  <IconReport />
                  Get report
                </>
              )}
            </CreateScanLink>
          )}
        </td>
      )}
      <td data-title="Results" className="table-actions">
        {isPreviewBuild && build.state === 'success' && (
          <p className="site-link">
            <BranchViewLink
              branchName={build.branch}
              site={build.site}
              showIcon
              completedAt={build.completedAt}
            />
          </p>
        )}
        {isPreviewBuild && ['error', 'success'].includes(build.state) && (
          <CreateBuildLink
            handlerParams={{ buildId: build.id, siteId }}
            handleClick={buildActions.restartBuild}
            className="usa-button small-button rebuild-button"
          >
            Rebuild
          </CreateBuildLink>
        )}

      </td>
    </tr>
  );
};

SiteBuildsBuild.propTypes = {
  build: BUILD.isRequired,
  // we're getting previewBuilds from the parent
  // eslint-disable-next-line react/forbid-prop-types
  previewBuilds: PropTypes.object,
  showBuildTasks: PropTypes.bool,
  site: SITE.isRequired,
};
SiteBuildsBuild.defaultProps = {
  showBuildTasks: false,
  previewBuilds: [],
};

export default SiteBuildsBuild;
