/* eslint-disable react/forbid-prop-types */

import React from 'react';
import PropTypes from 'prop-types';
import { useBuildLogs } from '../../hooks';
import SiteBuildLogTable from './siteBuildLogTable';
import DownloadBuildLogsButton from './downloadBuildLogsButton';

export const REFRESH_INTERVAL = 15 * 1000;

const SiteBuildLogs = ({ buildId: buildIdStr }) => {
  const buildId = parseInt(buildIdStr, 10);
  const { logs } = useBuildLogs(buildId);

  return (
    <div>
      <div className="log-tools">
        <ul className="usa-unstyled-list">
          <li><DownloadBuildLogsButton buildId={buildId} buildLogsData={logs} /></li>
        </ul>
      </div>
      <SiteBuildLogTable buildLogs={logs} />
    </div>
  );
};

SiteBuildLogs.propTypes = {
  buildId: PropTypes.string.isRequired,
};

export default React.memo(SiteBuildLogs);
