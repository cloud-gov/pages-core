/* eslint-disable react/jsx-one-expression-per-line */
/* eslint-disable react/forbid-prop-types */

import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import prettyBytes from 'pretty-bytes';
import {
  IconCheckCircle, IconClock, IconExclamationCircle, IconSpinner,
} from '../icons';
import CommitSummary from './CommitSummary';
import api from '../../util/federalistApi';

export const REFRESH_INTERVAL = 15 * 10000;

function createArtifactFileName(whichBuildTask, whichBuildId) {
  return whichBuildTask.name + whichBuildId;
}

const taskSummaryIcon = ({ status, count }) => {
  let summary;
  let icon;
  switch (status) {
    case 'error':
      summary = 'Scan canceled';
      icon = IconExclamationCircle;
      break;
    case 'processing':
      summary = 'Scan in progress';
      icon = IconSpinner;
      break;
    case 'skipped':
      summary = 'Scan skipped';
      icon = null;
      break;
    case 'queued':
    case 'created':
      summary = 'Scan queued';
      icon = IconClock;
      break;
    case 'success':
      if (count === 1) {
        summary = '1 issue found';
      } else if (count > 1) {
        summary = `${count} issues found`;
      } else {
        summary = 'No issues found';
      }
      icon = IconCheckCircle;
      break;
    default:
      summary = status;
      icon = null;
  }
  return { summary, icon };
};

const SiteBuildTasks = () => {
  const { buildId: buildIdStr } = useParams();
  const buildId = parseInt(buildIdStr, 10);
  const [buildTasks, setBuildTasks] = useState([]);
  const [errorMessage, setErrorMessage] = useState([]);

  let intervalHandle;
  useEffect(() => {
    function fetchTasks(id) {
      return api.fetchTasks(id).then((tasks) => {
        if (!tasks) {
          throw new Error('Tasks could not be retrieved for this build.');
        }
        setBuildTasks([...tasks]);
        setErrorMessage(null);
        return tasks;
      }).catch((error) => { setErrorMessage(error.message); });
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
      <CommitSummary buildId={buildId} />
      <div className="log-tools">
        <ul className="usa-unstyled-list">
          <li>
            <Link className="usa-button usa-button-secondary" to="./../logs">
              View build logs
            </Link>
          </li>
        </ul>
      </div>

      { errorMessage && buildTasks && (
        <div>
          { errorMessage }
        </div>
      )}
      {(!buildTasks || buildTasks?.length === 0) && !errorMessage && (
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
                  const { summary, icon } = taskSummaryIcon(task);

                  return (
                    <tr key={task.id}>
                      <th scope="row" data-title="Scan">
                        <div className="build-info">
                          <div className="build-info-icon" title={task.status}>
                            { icon && React.createElement(icon) }
                          </div>
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
                        <ul className="results-list unstyled-list">
                          <li className="result-item">
                            { summary }
                            <br />
                          </li>
                          {task.status === 'success' && task.artifact && task.artifact.url && (
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
