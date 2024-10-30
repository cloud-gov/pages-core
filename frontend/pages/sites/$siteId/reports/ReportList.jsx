import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

import { dateAndTimeSimple, timeFrom, dateAndTime } from '@util/datetime';

import FilterIndicator from '@shared/FilterIndicator';
import GithubBuildBranchLink from '@shared/GithubBuildBranchLink';
import GithubBuildShaLink from '@shared/GithubBuildShaLink';
import { IconX } from '@shared/icons';
import { SITE } from '@propTypes';

import ReportResultsSummary from './ReportResultsSummary';

export default function ReportList({
  scans,
  buildIdToFilterBy,
  site,
  filteredScans,
  clearParams,
}) {
  return (
    <>
      <h3 className="font-sans-lg">Generated reports ({scans.length})</h3>
      <FilterIndicator
        criteria={buildIdToFilterBy ? `build #${buildIdToFilterBy}` : null}
        count={filteredScans.length}
        noun="report"
      >
        <>
          {' '}
          <a
            href="#list"
            role="button"
            tabIndex="0"
            className="usa-link"
            onClick={clearParams}
          >
            Show all reports
            <span className="filter-close-button" title="close filter">
              <IconX />
            </span>
          </a>{' '}
        </>
      </FilterIndicator>
      <div className="grid-col-12 table-container">
        <table
          id="list"
          className={`
            usa-table
            usa-table--borderless
            usa-table--stacked
            log-table
            log-table__site-scans
            width-full
            table-full-width
          `}
        >
          <thead>
            <tr>
              <th scope="col">Report</th>
              <th scope="col">Build & branch</th>
              <th scope="col">Results</th>
            </tr>
          </thead>
          <tbody>
            {scans &&
              filteredScans.map((scan) => (
                <tr key={scan.id}>
                  <th scope="row" data-title="Report">
                    <div className="scan-info">
                      <h3 className="scan-info-name">
                        {scan.BuildTaskType.name}
                        {' #'}
                        {scan.id}
                      </h3>
                      {scan.createdAt && (
                        <h4 className="scan-info-timestamp">
                          {'Generated '}
                          <span title={timeFrom(scan.createdAt)}>
                            {dateAndTimeSimple(scan.createdAt)}
                          </span>
                        </h4>
                      )}
                    </div>
                  </th>
                  <td data-title="Build & branch">
                    <div className="branch-info">
                      {'For '}
                      <Link to={`/sites/${site.id}/builds/${scan.buildId}/logs`}>
                        build <span>#{scan.buildId}</span>
                      </Link>
                      {' on '}
                      <GithubBuildBranchLink build={scan.Build} site={site} />
                      <div className="commit-info">
                        <GithubBuildShaLink build={scan.Build} site={site} />
                        <span className="commit-user" title={scan.Build.user?.email}>
                          {scan.Build.username}
                        </span>
                        <span
                          className="commit-time"
                          title={dateAndTime(scan.Build.createdAt)}
                        >
                          {timeFrom(scan.Build.createdAt)}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td data-title="Results" className="scan-results">
                    <ReportResultsSummary status={scan.status} count={scan.count}>
                      {(scan.artifact || parseInt(scan.count, 10) > -1) && (
                        <Link
                          reloadDocument
                          to={`/report/${scan.id}`}
                          title={`View report results for ${scan.BuildTaskType.name}`}
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
        {(!scans || scans.length < 1) && (
          <p>Looks like this site doesn’t have any reports yet. </p>
        )}
        {filteredScans.length < 1 && (
          <p>
            No matching reports found.{' '}
            <a
              href="#list"
              role="button"
              tabIndex="0"
              className="usa-link"
              onClick={clearParams}
            >
              Clear filters
            </a>{' '}
            to show all reports.
          </p>
        )}

        {filteredScans.length > 0 && !buildIdToFilterBy && (
          <>
            <p>Showing {scans.length} most recent report(s).</p>
            {scans.length >= 100 ? (
              <p>List only displays 100 most recent reports from the last 180 days.</p>
            ) : null}
          </>
        )}
      </div>
    </>
  );
}

ReportList.propTypes = {
  scans: PropTypes.array,
  buildIdToFilterBy: PropTypes.number,
  site: SITE,
  filteredScans: PropTypes.array,
  clearParams: PropTypes.func,
};
