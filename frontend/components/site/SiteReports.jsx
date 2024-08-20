import React from 'react';
import { useSearchParams, Link, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { sandboxMsg } from '../../util';
import {
  dateAndTimeSimple,
  timestampUTC,
  timeFrom,
  dateAndTime,
  dateOnly,
} from '../../util/datetime';

import LoadingIndicator from '../LoadingIndicator';
import GithubBuildBranchLink from '../GithubBuildBranchLink';
import GithubBuildShaLink from '../GithubBuildShaLink';
import AlertBanner from '../alertBanner';

import { useSiteBuildTasks } from '../../hooks/useSiteBuildTasks';
import { useBuildTasksForSite } from '../../hooks/useBuildTasksForSite';
import { currentSite } from '../../selectors/site';
import { getOrgById } from '../../selectors/organization';
import ReportResultsSummary from '../ReportResultsSummary';
import FilterIndicator from '../FilterIndicator';

const {
  setDate, isBefore, startOfToday, addMonths,
} = require('date-fns');

function SiteReports() {
  const { id } = useParams();
  const site = useSelector(state => currentSite(state.sites, id));
  const organization = useSelector(state => getOrgById(state.organizations, site.organizationId));
  const { buildTasks: scans, isLoading } = useBuildTasksForSite(id);
  const { siteBuildTasks } = useSiteBuildTasks(id);
  const [searchParams, setSearchParams] = useSearchParams(false);
  const today = startOfToday();

  function nextScanDate(siteBuildTask) {
    if (!siteBuildTask.metadata.runDay) return null;
    const thisMonthScan = setDate(today, siteBuildTask.metadata.runDay);
    if (isBefore(thisMonthScan, today)) {
      return addMonths(thisMonthScan, 1);
    }
    return thisMonthScan;
  }

  if (!site || !scans) return null;
  const branchToBeScanned = site?.defaultBranch || 'most recently built';
  const buildIdToFilterBy = Number(searchParams.get('build'));
  // if filter isn't set or is not set to a valid build ID (positive int), show all
  /* eslint-disable-next-line max-len */
  const filteredScans = scans?.filter(scan => !buildIdToFilterBy || scan.buildId === buildIdToFilterBy);
  function clearParams() { setSearchParams({}); }

  return (
    <div>
      <div>
        { organization?.isSandbox
          && (
          <AlertBanner
            status="warning"
            message={sandboxMsg(organization.daysUntilSandboxCleaning, 'site reports')}
            alertRole={false}
          />
          )}
      </div>
      { isLoading
        ? <LoadingIndicator />
        : (
          <>
            <div>
              <p>
                {/* eslint-disable-next-line max-len */}
                Pages is now offering automated monthly quality reports for customer production sites. These reports examine your Pages site for common website issues and provide guidance and resources for remediation. Pages Reports are part of a larger effort to help our customers comply with OMB Memo 23-22 and ATO requirements.
              </p>
              { siteBuildTasks.length > 0 && !buildIdToFilterBy && (
                <table id="scheduled" className="usa-table table-full-width usa-table-borderless site-reports-table">
                  <thead>
                    <tr>
                      <th scope="col">Report</th>
                      <th scope="col" className="nowrap">Next report on</th>
                    </tr>
                  </thead>
                  <tbody>
                    { siteBuildTasks.map(task => (
                      <tr key={task.id}>
                        <th scope="row">
                          <h3>{task.name}</h3>
                          <p>
                            {`${task.description} For more information, refer to the `}
                            <Link to={task.url}>documentation</Link>
                            .
                          </p>
                        </th>
                        <td>
                          {dateOnly(nextScanDate(task))}
                          {' on '}
                          <b>{branchToBeScanned}</b>
                        </td>
                      </tr>
                    ))}

                  </tbody>
                </table>
              )}
              <p>
                You can request an immediate report for any recent site branch from
                {' '}
                <Link to={`/sites/${id}/builds`}>Build history</Link>
                . You can also customize your report results in
                {' '}
                <Link to={`/sites/${id}/settings`}>Site settings</Link>
                . For more information on Pages Reports, check out the
                {' '}
                <a
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Pages documentation on reports"
                  href="https://cloud.gov/pages/documentation/build-scans/"
                >
                  docs
                </a>
                .
              </p>
            </div>
            <FilterIndicator criteria={buildIdToFilterBy ? `build #${buildIdToFilterBy}` : null} count={filteredScans.length} noun="report">
              <>
                {' '}
                <a href="#list" role="button" tabIndex="0" className="usa-link" onClick={clearParams}>Clear filters</a>
                {' '}
                to show all reports.
              </>
            </FilterIndicator>
            <div className="table-container">
              <table
                id="list"
                className="usa-table-borderless log-table log-table__site-scans table-full-width"
              >
                <thead>
                  <tr>
                    <th scope="col">Report</th>
                    <th scope="col">Build & branch</th>
                    <th scope="col">Results</th>
                  </tr>
                </thead>
                <tbody>
                  {scans && filteredScans.map(scan => (
                    <tr key={scan.id}>
                      <th scope="row" data-title="Report">
                        <div className="scan-info">
                          <h3 className="scan-info-name">
                            { scan.BuildTaskType.name }
                            {' #'}
                            { scan.id }
                          </h3>
                          {scan.createdAt && (
                            <h4 className="scan-info-timestamp">
                              {'Generated '}
                              <span title={timeFrom(scan.createdAt)}>
                                { dateAndTimeSimple(scan.createdAt) }
                              </span>
                            </h4>
                          )}
                        </div>

                      </th>
                      <td data-title="Build & branch">
                        <div className="branch-info">
                          {'For '}
                          <Link to={`/sites/${id}/builds/${scan.buildId}/logs`}>
                            build
                            {' '}
                            <span>
                              #
                              {scan.buildId}
                            </span>
                          </Link>
                          {' on '}
                          <GithubBuildBranchLink build={scan.Build} site={site} />
                          <div className="commit-info">
                            <GithubBuildShaLink build={scan.Build} site={site} />
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
                        <ReportResultsSummary status={scan.status} count={scan.count}>
                          { (scan.artifact || parseInt(scan.count, 10) > -1) && (
                            <Link
                              reloadDocument
                              to={`/report/${scan.id}`}
                              title={'View report results for ' && scan.BuildTaskType.name}
                              className="artifact-filename"
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              View full results
                            </Link>
                          )}
                        </ReportResultsSummary>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              { (!scans || scans.length < 1) && (
                <p>Looks like this site doesn’t have any reports yet. </p>
              ) }
              {filteredScans.length < 1 && (
                <p>
                  No matching reports found.
                  {' '}
                  <a href="#list" role="button" tabIndex="0" className="usa-link" onClick={clearParams}>Clear filters</a>
                  {' '}
                  to show all reports.
                </p>
              ) }

              {(filteredScans.length > 0 && !buildIdToFilterBy) && (
                <>
                  <p>
                    Showing
                    {' '}
                    { scans.length }
                    {' '}
                    most recent report(s).
                  </p>
                  { scans.length >= 100
                    ? <p>List only displays 100 most recent reports from the last 180 days.</p>
                    : null }
                </>
              ) }

            </div>
          </>
        )}
      <p>
        We welcome your feedback on this experimental feature. Email
        {' '}
        <a href="mailto:pages-support@cloud.gov?subject=Site%Reports%20feedback" target="_blank" rel="noreferrer">pages-support@cloud.gov</a>
        {' '}
        with the subject line “Reports feedback” to let us know what you think!
      </p>
    </div>
  );
}

export { SiteReports };
export default SiteReports;
