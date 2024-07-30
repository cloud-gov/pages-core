/* eslint-disable react/jsx-one-expression-per-line */
/* eslint-disable react/forbid-prop-types */

import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import prettyBytes from 'pretty-bytes';
import { useBuildDetails } from '../../hooks';
import CommitSummary from './CommitSummary';
import ScanResultsSummary from '../ScanResultsSummary';
import api from '../../util/federalistApi';
import {
  dateAndTimeSimple,
  timeFrom,
} from '../../util/datetime';

export const REFRESH_INTERVAL = 15 * 10000;

const SiteScanResultsList = () => {
  const { buildId: buildIdStr } = useParams();
  const buildId = parseInt(buildIdStr, 10);
  const [buildTasks, setBuildTasks] = useState([]);

  const { buildDetails } = useBuildDetails(buildId);

  let intervalHandle;
  useEffect(() => {
    function fetchTasks(thisBuildId) {
      return api.fetchTasks(thisBuildId).then((tasks) => {
        setBuildTasks([...tasks]);
        return tasks;
      });
    }

    fetchTasks(buildId);
    // Really need to stop interval if all tasks are complete
    intervalHandle = setInterval(() => {
      fetchTasks(buildId);
    }, REFRESH_INTERVAL);

    return () => {
      clearInterval(intervalHandle);
    };
  }, []);

  return (
    <div>
      <CommitSummary buildDetails={buildDetails} />
      <div className="log-tools">
        <ul className="usa-unstyled-list">
          <li>
            <Link className="usa-button usa-button-secondary" to="./../logs">
              View build logs
            </Link>
          </li>
        </ul>
      </div>
      {(!buildTasks || buildTasks?.length === 0) && (
        <div>
          This build does not have any scans queued.
        </div>
      )}
      {(buildTasks && buildTasks?.length > 0) && (
        <>
          <div className="table-container">
            <table
              className="usa-table-borderless log-table log-table__site-scans table-full-width"
            >
              <thead>
                <tr>
                  <th scope="col">Scan</th>
                  <th scope="col" width="25%">Results</th>
                </tr>
              </thead>
              <tbody>
                {buildTasks.map(task => (
                  <tr key={task.id}>
                    <th scope="row" data-title="Scan">
                      <div className="scan-info">
                        <div className="scan-info-details">
                          <h3 className="scan-info-status">{ task.BuildTaskType.name }</h3>
                          <p>
                            {task.BuildTaskType.description}
                            {' '}
                            For more information, check out the&nbsp;
                            <a href={task.BuildTaskType.url} target="_blank ">documentation</a>
                            .
                          </p>
                        </div>
                      </div>
                    </th>
                    <td data-title="Results">
                      <ScanResultsSummary status={task.status} count={task.count}>
                        { (task.status === 'success' || task.status === 'error') && (
                        <p>
                          <span title={dateAndTimeSimple(task.updatedAt)}>
                            { timeFrom(task.updatedAt) }
                          </span>
                        </p>
                        )}

                        {task.status === 'success' && task.artifact?.url && (
                        <>
                          <Link
                            to={task.artifact.url}
                            title={'Download scan results for ' && task.BuildTaskType.name}
                            className="artifact-filename"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Download scan results
                          </Link>
                          <span className="artifact-filesize">
                                &nbsp;({ prettyBytes(task.artifact.size) })
                          </span>
                        </>
                        )}
                      </ScanResultsSummary>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div>
            <p>
              We welcome your feedback on this experimental feature. Email
              {' '}
              <a href="mailto:pages-support@cloud.gov?subject=Build%20scans%20feedback" target="_blank" rel="noreferrer">pages-support@cloud.gov</a>
              {' '}
              with the subject line “Build scans feedback” to let us know what you think!
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default SiteScanResultsList;
