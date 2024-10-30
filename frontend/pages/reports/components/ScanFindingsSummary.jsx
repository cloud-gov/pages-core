import React from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import { relPath, plural } from '@util/reports';
import ScanPagePathAndReportLink from './ScanPagePathReportLink';

function ScanFindingsSummaryTable({ findings = [], hasSuppressColumn = false, baseurl }) {
  if (findings.length < 1) return null;

  return (
    <table
      className={`
        usa-table
        usa-table--striped
        usa-table--borderless
        usa-table--stacked
        usa-table--compact
        font-body-xs
        width-full
        margin-bottom-4
      `}
      aria-label=""
    >
      <thead>
        <tr>
          <th scope="col" className="text-no-wrap">
            Severity
          </th>
          <th scope="col" className="width-full">
            Finding
          </th>
          {hasSuppressColumn && (
            <th scope="col" className="text-no-wrap">
              Suppressed by
            </th>
          )}
        </tr>
      </thead>
      <tbody>
        {findings.map((finding, fi) => (
          <tr key={finding.alertRef || finding.id}>
            <td data-label="Severity Risk level" className="font-body-xs text-no-wrap">
              <b className="usa-sr-only">
                Severity:
                <br />
              </b>
              <span className={`usa-tag radius-pill bg-${finding.severity?.color}`}>
                {finding.severity?.label}
              </span>
            </td>
            <th data-label="Finding" scope="row">
              <b className="usa-sr-only">
                Result name:
                <br />
              </b>
              {!finding.anchor && (
                <details open={fi === 0}>
                  <summary>
                    <b>{finding.name}</b>
                    {' on '}
                    {finding.count}
                    {plural(finding.count, ' page')}
                  </summary>
                  <ol className="font-mono-3xs">
                    {finding.urls?.map((url, i) => (
                      <li key={url} className="margin-bottom-1 report-item">
                        <ScanPagePathAndReportLink
                          pagePath={relPath(url, baseurl)}
                          // eslint-disable-next-line max-len
                          reportLink={`${finding.reports[i]}#finding-${finding.id}${hasSuppressColumn ? '-suppressed' : ''}`}
                          pageURL={url}
                        />
                      </li>
                    ))}
                  </ol>
                </details>
              )}
              {finding.anchor && (
                <>
                  <a
                    className="usa-link text-bold"
                    href={`
                      #finding-${finding.anchor}${hasSuppressColumn ? '-suppressed' : ''}
                    `}
                  >
                    {finding.name}
                  </a>
                  {' in '}
                  {finding.count}
                  {plural(finding.count, ' place')}
                </>
              )}
            </th>
            {hasSuppressColumn && (
              <td data-label="Suppressed source" className="font-body-xs text-right">
                {finding.ignore && (
                  <i className="text-no-wrap">
                    {finding.ignoreSource || 'customer criteria'}
                  </i>
                )}
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

ScanFindingsSummaryTable.propTypes = {
  findings: PropTypes.array.isRequired,
  hasSuppressColumn: PropTypes.bool,
  baseurl: PropTypes.string,
};

const ScanFindingsSummary = ({
  suppressedFindings = [],
  unsuppressedFindings = [],
  baseurl,
}) => (
  <>
    {unsuppressedFindings.length > 0 && (
      <>
        <h3 className="font-heading-lg margin-bottom-1 padding-top-2 margin-y-2">
          ⚠️ Unsuppressed results
          <span className="font-body-lg padding-left-1 text-secondary-vivid">
            ({unsuppressedFindings.length})
          </span>
        </h3>
        <ScanFindingsSummaryTable baseurl={baseurl} findings={unsuppressedFindings} />
      </>
    )}
    {suppressedFindings.length > 0 && (
      <>
        <h3 className="font-heading-lg margin-bottom-1 padding-top-2 margin-y-2">
          🔕 Suppressed or informational results
          <span className="font-body-lg padding-left-1 text-accent-cool-darker">
            ({suppressedFindings.length})
          </span>
        </h3>
        <section className="usa-alert usa-alert--info margin-top-3">
          <div className="usa-alert__body">
            <p className="usa-alert__text">
              <b>
                This report contains{' '}
                <a className="usa-link" href="#about-suppressed">
                  suppressed results
                </a>
              </b>
              , which don’t count towards your total issues. For more information about
              excluded results and suppression rules, review the{' '}
              <Link
                to="https://cloud.gov/pages/documentation/automated-site-reports/"
                className="usa-link"
              >
                Automated Site Reports documentation
              </Link>
              .
            </p>
          </div>
        </section>
        <ScanFindingsSummaryTable
          baseurl={baseurl}
          findings={suppressedFindings}
          hasSuppressColumn
        />
      </>
    )}
  </>
);

ScanFindingsSummary.propTypes = {
  suppressedFindings: PropTypes.array,
  unsuppressedFindings: PropTypes.array,
  baseurl: PropTypes.string,
};

export default ScanFindingsSummary;
