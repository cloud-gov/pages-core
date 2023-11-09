/* eslint-disable react/forbid-prop-types */

import React from 'react';
import { Link, useParams } from 'react-router-dom';

import { useBuildLogs } from '../../hooks';
import SiteBuildLogTable from './siteBuildLogTable';
import DownloadBuildLogsButton from './downloadBuildLogsButton';

export const REFRESH_INTERVAL = 15 * 1000;

// figure out how to get this out of the API wrapper like Features.enabled(Features.Flags.FEATURE_BUILD_TASKS)
export const FEATURE_BUILD_TASKS = true;


const SiteBuildLogs = () => {
  const { buildId: buildIdStr } = useParams();
  const buildId = parseInt(buildIdStr, 10);
  const { logs, state } = useBuildLogs(buildId);


  return (
    <div>
      <div className="log-tools">
        <ul className="usa-unstyled-list">
            {(FEATURE_BUILD_TASKS) && (
              <li><Link className="usa-button usa-button-secondary" to={`./../scans`}>View scan results</Link></li>
            )}
          <li><DownloadBuildLogsButton buildId={buildId} buildLogsData={logs} /></li>
        </ul>
      </div>
    {(!logs || logs?.length === 0) && (
      <div>
        <SiteBuildLogTable buildLogs={['This build does not have any build logs.']} />
      </div>
    )}
    {(logs && logs?.length > 0) && (
      <SiteBuildLogTable buildLogs={logs} buildState={state} />
    )}
    </div>
  );
};

export default React.memo(SiteBuildLogs);
