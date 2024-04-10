/* eslint-disable react/jsx-one-expression-per-line */
/* eslint-disable react/forbid-prop-types */

import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import prettyBytes from 'pretty-bytes';
import {
  IconCheckCircle, IconClock, IconExclamationCircle, IconSpinner, IconX,
} from '../icons';
import { useBuildDetails } from '../../hooks';
import CommitSummary from './CommitSummary';
import api from '../../util/federalistApi';

export const REFRESH_INTERVAL = 15 * 10000;

const taskSummaryIcon = ({ status, count }) => {
  let summary;
  let icon;
  let state;
  switch (status) {
    case 'error':
      state = 'Failed';
      summary = 'Scan failed before results could be found';
      icon = IconX;
      break;
    case 'processing':
      state = 'Processing';
      summary = 'Scan in progress';
      icon = IconSpinner;
      break;
    case 'queued':
    case 'created':
      state = 'Queued';
      summary = 'Scan queued';
      icon = IconClock;
      break;
    case 'success':
      if (count === 1) {
        icon = IconExclamationCircle;
        state = '1 issue found';
      } else if (count > 1) {
        icon = IconExclamationCircle;
        state = `${count} issues found`;
      } else {
        icon = IconCheckCircle;
        state = 'No issues found';
      }
      summary = 'Full details available:';
      break;
    default:
      summary = status;
      icon = null;
  }
  return { summary, icon, state };
};

const SiteBuildTasks = () => {
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
              className="usa-table-borderless log-table log-table__site-builds table-full-width"
            >
              <thead>
                <tr>
                  <th scope="col">Scan</th>
                  <th scope="col" width="25%">Results</th>
                </tr>
              </thead>
              <tbody>
                {buildTasks.map((task) => {
                  const { summary, icon, state } = taskSummaryIcon(task);

                  return (
                    <tr key={task.id}>
                      <th scope="row" data-title="Scan">
                        <div className="build-info">
                          <div className="build-info-details">
                            <h3 className="build-info-status">{ task.BuildTaskType.name }</h3>
                            <p className="build-info-details">
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
                        <div className="build-info-details">
                          <h4 className="build-info-status">
                            <span className="build-info-inline-icon">
                              { icon && React.createElement(icon) }
                            </span>
                            {state}
                          </h4>
                          <ul className="results-list unstyled-list">
                            <li className="result-item">
                              {summary}
                            </li>
                            {task.status === 'success' && task.artifact?.url && (
                              <li className="result-item">
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
                              </li>
                            )}
                          </ul>
                        </div>
                      </td>

                    </tr>
                  );
                })}
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

export default React.memo(SiteBuildTasks);
