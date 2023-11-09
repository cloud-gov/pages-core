/* eslint-disable react/forbid-prop-types */

import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  IconCheckCircle, IconClock, IconExclamationCircle, IconSpinner,
} from '../icons';

import api from '../../util/federalistApi';

export const REFRESH_INTERVAL = 15 * 10000;

const taskSummaryIcon = ({ status }) => {
  let summaryIcon;
  switch (status) {
    case 'error':
      summaryIcon = { summary: 'Scan canceled', icon: IconExclamationCircle,
      };
      break;
    case 'processing':
      summaryIcon = { summary: 'Scan in progress', icon: IconSpinner };
      break;
    case 'skipped':
      summaryIcon = { summary: 'Scan skipped', icon: null };
      break;
    case 'queued':
    case 'created':
      summaryIcon = { summary: 'Scan queued', icon: IconClock };
      break;
    case 'success':
      summaryIcon = { summary: 'Scan completed', icon: IconCheckCircle };
      break;
    default:
      summaryIcon = { summary: status, icon: null };
  }
  return summaryIcon;
};

const SiteBuildTasks = () => {
  const { buildId: buildIdStr } = useParams();
  const buildId = parseInt(buildIdStr, 10);
  const [buildTasks, setBuildTasks] = useState([]);

  let intervalHandle;
  useEffect(() => {
    function fetchTasks(buildId) {
      return api.fetchTasks(buildId).then((tasks) => { 
        setBuildTasks([...tasks]);
        return tasks 
      });
    }
    fetchTasks(buildId);
    // Really need to stop interval if all tasks are complete
    intervalHandle = setInterval(() => {
      fetchTasks(buildId)
    }, REFRESH_INTERVAL);

    return () => {
      clearInterval(intervalHandle);
    };
  }, []);

  if (!buildTasks && buildTasks?.length === 0) {
    return (
      <div>
        This build does not have any scans queued.
      </div>
    );
  }

  return (
    <div>
      <div className="log-tools">
        <ul className="usa-unstyled-list">
          <li>
            <Link className="usa-button usa-button-secondary" to={`./../logs`}>
              View build logs
            </Link>
          </li>
        </ul>
      </div>
      <p>Tasks for build {buildId} go here</p> 
      <div className="table-container">
        <table
          className="usa-table-borderless log-table log-table__site-builds table-full-width"
        > 
          <thead>
            <tr>
              <th scope="col">Scan</th>
              <th scope="col">Results</th>
            </tr>
          </thead>
          <tbody>
            {buildTasks.map((task) => {
              const { summary, icon } = taskSummaryIcon(task);

              return (
                <tr key={task.id}>
                  <th scope="row" data-title="Scan">
                    <div className="build-info">
                      <div className="build-info-icon">
                        { icon && React.createElement(icon) }
                      </div>
                      <div className="build-info-details">
                        <h3 className="build-info-status">{ summary }</h3>
                      </div>
                    </div>
                  </th>
                  <td data-title="Results">
                    <ul className="results-list unstyled-list">
                      <li className="result-item">
                        { task.status }, { task.message }, { task.artifact }<br />
                        <pre>
                          {JSON.stringify(task)}
                        </pre>
                      </li>
                    </ul>
                  </td >
                  
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default React.memo(SiteBuildTasks);
