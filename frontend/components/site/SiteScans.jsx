import React from 'react';
import { useSelector } from 'react-redux';
import { Link, useParams } from 'react-router-dom';
import {
  IconCheckCircle, IconClock, IconExclamationCircle, IconSpinner, IconX,
} from '../icons';
import prettyBytes from 'pretty-bytes';
import {
  dateAndTimeSimple,
  duration,
  timeFrom,
  dateAndTime,
} from '../../util/datetime';

import { currentSite } from '../../selectors/site';
import { useBuildTasksForSite } from '../../hooks/useBuildTasksForSite';

export const REFRESH_INTERVAL = 15 * 10000;

function SiteScans() {
  const { id } = useParams();
  const site = useSelector(state => currentSite(state.sites, id));
  const { buildTasks: scans } = useBuildTasksForSite(id);

  // enable auto reload
  // let intervalHandle;
  // useEffect(() => {
  //   function fetchTasks(thisBuildId) {
  //     return api.fetchTasks(thisBuildId).then((tasks) => {
  //       setBuildTasks([...tasks]);
  //       return tasks;
  //     });
  //   }
  //   fetchTasks(buildId);
  //   // Really need to stop interval if all tasks are complete
  //   intervalHandle = setInterval(() => {
  //     fetchTasks(buildId);
  //   }, REFRESH_INTERVAL);

  //   return () => {
  //     clearInterval(intervalHandle);
  //   };
  // }, []);
  
  const scanSummaryIcon = ({ status, count, artifact = null }) => {
    let summary;
    let icon;
    let state;
    switch (status) {
      case 'error':
        state = 'Failed';
        summary = 'Scan failed before results could be found';
        icon = IconX;
        break;
      case 'cancelled':
        state = 'Cancelled';
        summary = 'Failed builds cannot be scanned';
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
          artifact = {
            url: "#",
            filesize: 12345
          };
        } else if (count > 1) {
          icon = IconExclamationCircle;
          state = `${count} issues found`;
          artifact = {
            url: "#",
            size: 999
          };
        } else {
          icon = IconCheckCircle;
          state = 'No issues found';
          artifact = {
            url: "#",
            size: 5432
          };
        }
        summary = 'Full details available:';
        break;
      default:
        summary = status;
        icon = null;
    }
    return { summary, icon, state, artifact };
  };



  if (!site || !scans) {
    return null;
  }

  return (
    <div>
      <ul>
        {scans.map((scan) => {
          const { summary, icon, state, artifact } = scanSummaryIcon(scan);
          return (
            <li key={scan.id}>
              { icon && false &&  React.createElement(icon) }
              Started <span title={dateAndTimeSimple(scan.createdAt)}>
                { timeFrom(scan.createdAt) }
              </span>
              <br />
              {state}
              <br />
              {scan.message} / {summary}
              <br />
              <b>{scan.BuildTaskType.name}</b>
              <br />
              {scan.BuildTaskType.description}
              <br />
              {artifact?.url && (
                <>
                  <Link
                    to={artifact?.url}
                    title={'Download scan results for ' && scan.BuildTaskType.name}
                    className="artifact-filename"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Download scan results
                  </Link>
                  <span className="artifact-filesize">
                    &nbsp;({ prettyBytes(artifact?.size) })
                  </span>
                </>
              )}
              <Link to={`/sites/${site.id}/builds/${scan.buildId}/logs`}>
                Go to build logs
              </Link>
              <br/>
              Build: 
              {JSON.stringify(scan.Build)}
              <code>{JSON.stringify(scan)}</code>
            </li>
          )}
        )}
      </ul>
    </div>
  );
}

export { SiteScans };
export default SiteScans;
