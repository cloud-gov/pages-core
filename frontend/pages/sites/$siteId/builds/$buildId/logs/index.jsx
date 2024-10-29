import React from 'react';
import { useParams } from 'react-router-dom';

import { useBuildLogs, useBuildDetails } from '@hooks';
import LoadingIndicator from '@shared/LoadingIndicator';
import SiteBuildLogTable from './SiteBuildLogTable';
import DownloadBuildLogsButton from './DownloadBuildLogsButton';
import CommitSummary from './CommitSummary';

export const REFRESH_INTERVAL = 15 * 1000;
const BUILD_LOG_RETENTION_LIMIT = 180 * 24 * 60 * 60 * 1000; // 180 days in milliseconds

function buildTooOld(build) {
  return new Date() - new Date(build?.completedAt) > BUILD_LOG_RETENTION_LIMIT;
}

function getSiteBuildLogTable(buildDetails, logs, state) {
  if (buildTooOld(buildDetails)) {
    return (
      <SiteBuildLogTable
        buildLogs={[
          'Builds more than 180 days old are deleted according to platform policy.',
        ]}
      />
    );
  }

  if (logs && logs?.length > 0) {
    return <SiteBuildLogTable buildLogs={logs} buildState={state} />;
  }

  return <SiteBuildLogTable buildLogs={['This build does not have any build logs.']} />;
}

const BuildLogs = () => {
  const { buildId: buildIdStr } = useParams();
  const buildId = parseInt(buildIdStr, 10);
  const { buildDetails, isLoading: isLoadingBuildDetails } = useBuildDetails(buildId);
  const { logs, state, isLoading: isLoadingBuildLogs } = useBuildLogs(buildId);

  if (isLoadingBuildDetails || isLoadingBuildLogs) {
    return <LoadingIndicator size="mini" text="Getting build log details..." />;
  }

  return (
    <div>
      <CommitSummary buildDetails={buildDetails} />
      <div className="log-tools">
        <ul className="usa-list--unstyled">
          <li>
            <DownloadBuildLogsButton buildId={buildId} buildLogsData={logs} />
          </li>
        </ul>
      </div>
      {getSiteBuildLogTable(buildDetails, logs, state)}
    </div>
  );
};

export default React.memo(BuildLogs);
