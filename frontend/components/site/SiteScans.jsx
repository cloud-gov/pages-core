import React from 'react';
import { useSelector } from 'react-redux';
import { Link, useParams } from 'react-router-dom';
import prettyBytes from 'pretty-bytes';
import { sandboxMsg } from '../../util';
import {
  dateAndTimeSimple,
  timeFrom,
  dateAndTime,
} from '../../util/datetime';


import GitHubLink from '../GitHubLink';

import { useBuildTasksForSite } from '../../hooks/useBuildTasksForSite';
import { currentSite } from '../../selectors/site';
import { getOrgById } from '../../selectors/organization';
import ScanResultsSummary from '../ScanResultsSummary';


function SiteScans() {
  const { id } = useParams();
  const site = useSelector(state => currentSite(state.sites, id));
  const organization = useSelector(state => getOrgById(state.organizations, site.organizationId));
  let { buildTasks: scans, isLoading } = useBuildTasksForSite(id);

  const filteredScans = (scansList = scans) => {
    return scansList
      // fake adding artifacts, delete next line before merge
      .map(scan => Number.isInteger(scan.count) ? { ...scan, artifact: { url: '#foo', size: 12345} } : scan)
      .filter(scan => scan.status !== 'cancelled')
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


  if (!site || !scans) {
    return null;
  }

  return (
    <div>
      <div>
        { organization?.isSandbox
          && (
          <AlertBanner
            status="warning"
            message={sandboxMsg(organization.daysUntilSandboxCleaning, 'site scans')}
            alertRole={false}
          />
          )}
      </div>
      <div>
        <h3>Welcome to the Site Scans beta!</h3>
          <p>Pages is now offering automated monthly scans of your site. These scans run on your live site (or if you haven’t <Link to={`/sites/${id}/settings`}>configured a branch for your live site</Link>, then your latest site preview). This new offering is part of our larger efforts to support our customers in their obligations to comply with OMB Memo 23-22 and ATO requirements.</p>
        <p>Don’t want to wait? You can request an immediate scan of any site branch from the  <Link to={`/sites/${id}/builds`}>Build history page</Link>. You can also customize your report results in <Link to={`/sites/${id}/settings`}>Site settings</Link>. For more information on scans and rulesets, check out the
          {' '}
          <a
            target="_blank"
            rel="noopener noreferrer"
            title="Pages documentation on site scans"
            href="https://cloud.gov/pages/documentation/build-scans/"
          >
            documentation
          </a>
          .
        </p>
        <p>
          We welcome your feedback on this experimental feature. Email
          {' '}
          <a href="mailto:pages-support@cloud.gov?subject=Site%20scans%20feedback" target="_blank" rel="noreferrer">pages-support@cloud.gov</a>
          {' '}
          with the subject line “Site Scans feedback” to let us know what you think!
        </p>
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
                {scans && filteredScans().map((scan) => {
                  return (
                    <tr key={scan.id}>
                      <th scope="row" data-title="Scan">
                        <div className="scan-info">
                            <h3 className="scan-info-name">
                              { scan.BuildTaskType?.name || 'Scan name not available' }
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
                        <ScanResultsSummary status={scan.status} count={scan.count}>
                          { scan.artifact?.url && (
                            <>
                              <Link
                                to={scan.artifact?.url}
                                title={'Download scan results for ' && scan.BuildTaskType.name}
                                className="artifact-filename"
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                Download results
                              </Link>
                              {' '}
                              <span className="artifact-filesize">
                                ({ prettyBytes(scan.artifact?.size) })
                              </span>
                            </>
                        )}
                        </ScanResultsSummary>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
             { !scans.length && (
              <p>Looks like you don’t have any scans yet. </p>
             ) }
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
