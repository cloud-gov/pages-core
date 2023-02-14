/* eslint-disable react/forbid-prop-types */

import React from 'react';
import { useParams } from 'react-router-dom';

import { useBuildLogs } from '../../hooks';
import SiteBuildLogTable from './siteBuildLogTable';
import DownloadBuildLogsButton from './downloadBuildLogsButton';

export const REFRESH_INTERVAL = 15 * 1000;

const SiteBuildLogs = () => {
  const { buildId: buildIdStr } = useParams();
  const buildId = parseInt(buildIdStr, 10);
  const { logs, state } = useBuildLogs(buildId);

  if (!logs || logs?.length === 0) {
    return (
      <div>
        <SiteBuildLogTable buildLogs={['This build does not have any build logs.']} />
      </div>
    );
  }

  return (
    <div>
      <div className="log-tools">
        <ul className="usa-unstyled-list">
          <li><DownloadBuildLogsButton buildId={buildId} buildLogsData={logs} /></li>
        </ul>
      </div>
      <SiteBuildLogTable buildLogs={logs} buildState={state} />
    </div>
  );
};

export default React.memo(SiteBuildLogs);
