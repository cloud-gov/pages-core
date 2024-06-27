import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link, useParams } from 'react-router-dom';
import prettyBytes from 'pretty-bytes';

import { sandboxMsg } from '../../util';
import {
  dateAndTimeSimple,
  duration,
  timeFrom,
  dateAndTime,
} from '../../util/datetime';

import {
  IconCheckCircle, IconClock, IconExclamationCircle, IconSpinner, IconX,
} from '../icons';
import GitHubLink from '../GitHubLink';
import api from '../../util/federalistApi';

import { useBuildTasksForSite } from '../../hooks/useBuildTasksForSite';
import { currentSite } from '../../selectors/site';
import { getOrgById } from '../../selectors/organization';



function SiteScans() {
  const { id } = useParams();
  const site = useSelector(state => currentSite(state.sites, id));
  const organization = useSelector(state => getOrgById(state.organizations, site.organizationId));
  let { buildTasks: scans, isLoading } = useBuildTasksForSite(id);

    
  function actualScans(scansList) {
    return scansList.filter(scan => scan.status !== 'cancelled')
  }

  function shaLink(build) {
    const { owner, repository } = site;
    const sha = build.clonedCommitSha || build.requestedCommitSha;
    if (sha) {
      return (
        <GitHubLink
          owner={owner}
          repository={repository}
          sha={sha}
          branch={null}
          text={sha.slice(0, 7)}
          icon="sha"
        />
      );
    }
    return null;
  }

  function branchLink(build) {
    const { owner, repository } = site;

    return (
      <GitHubLink
        owner={owner}
        repository={repository}
        sha={null}
        branch={build.branch}
        text={build.branch}
        icon="branch"
      />
    );
  }

  const scanSummaryIcon = ({ status, count, artifact = null }) => {
    let icon;
    let results;
    switch (status) {
      case 'error':
        results = 'Scan failed';
        icon = IconX;
        break;
      // this case should never happen, unless we want to show cancelled scans
      case 'cancelled':
        results = 'Failed builds cannot be scanned';
        icon = IconX;
        break;
      case 'processing':
        results = 'Scan in progress';
        icon = IconSpinner;
        break;
      case 'queued':
      case 'created':
        results = 'Scan queued';
        icon = IconClock;
        break;
      case 'success':
        if (count === 1) {
          icon = IconExclamationCircle;
          results = '1 issue found';
          artifact = {
            url: "#",
            filesize: 12345
          };
        } else if (count > 1) {
          icon = IconExclamationCircle;
          results = `${count} issues found`;
          artifact = {
            url: "#",
            size: 999
          };
        } else {
          icon = IconCheckCircle;
          results = 'No issues found';
          artifact = {
            url: "#",
            size: 5432
          };
        }
        break;
      default:
        icon = null;
    }
    return { icon, results, artifact };
  };

  if (!site || !scans) {
    return null;
  }

  return (
    <div>
      <div className="well">
        { organization?.isSandbox
          && (
          <AlertBanner
            status="warning"
            message={sandboxMsg(organization.daysUntilSandboxCleaning, 'site scans')}
            alertRole={false}
          />
          )}
      </div>

      { isLoading
        ? <LoadingIndicator />
        : (
          <div className="table-container">
            <table
              className="usa-table-borderless log-table log-table__site-scans table-full-width"
            >
              <thead>
                <tr>
                  <th scope="col">Scan</th>
                  <th scope="col">Branch</th>
                  <th scope="col">Results</th>
                </tr>
              </thead>
              <tbody>
                {actualScans(scans).map((scan) => {
                  const { summary, icon, results, artifact } = scanSummaryIcon(scan);
                  return (
                    <tr key={scan.id}>
                      <th scope="row" data-title="Scan">
                        <div className="scan-info">
                            <h3 className="scan-info-name">
                              { scan.BuildTaskType.name }
                            </h3>
                            {scan.createdAt && (
                              <p>
                                Scanned at
                                {' '}
                                <span title={timeFrom(scan.createdAt)}>
                                  { dateAndTimeSimple(scan.createdAt) }
                                </span>
                              </p>
                            )}

                        </div>

                      </th>
                      <td data-title="Branch">
                        <div className="branch-info">
                          { branchLink(scan.Build) }
                          <div className="commit-info">
                            { shaLink(scan.Build) }
                            <span className="commit-user" title={scan.Build.user?.email}>
                              { scan.Build.username }
                            </span>
                            <span className="commit-time" title={dateAndTime(scan.Build.createdAt)}>
                              { timeFrom(scan.Build.createdAt) }
                            </span>
                          </div>
                        </div>
                      </td>
                      <td data-title="Results" className="scan-results">
                        <div className="scan-results-status">
                          <h4>
                            { icon && (
                              <span className="scan-info-inline-icon">
                                { React.createElement(icon) }
                              </span>
                            )}
                            <span className={ artifact?.url ? '' : 'unbold'}>{ results }</span>
                          </h4>
                          { artifact?.url && (
                              <>
                                <Link
                                  to={artifact?.url}
                                  title={'Download scan results for ' && scan.BuildTaskType.name}
                                  className="artifact-filename"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  Download results
                                </Link>
                                {' '}
                                <span className="artifact-filesize">
                                  ({ prettyBytes(artifact?.size) })
                                </span>
                              </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p>
              Showing { scans.length } most recent scan(s).
            </p>
            { scans.length >= 100
              ? <p>List only displays 100 most recent scans from the last 180 days.</p>
              : null }
          </div>
        )}
    </div>
  );
}

export { SiteScans };
export default SiteScans;
