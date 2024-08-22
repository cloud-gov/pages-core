/* eslint-disable react/forbid-prop-types */
import React from 'react';
import PropTypes from 'prop-types';
import { relPath, plural } from '../../util/reports';
import ScanPagePathAndReportLink from './ScanPagePathReportLink';

function ScanFindingsSummaryTable({
  findings = [], hasSuppressColumn = false, baseurl,
}) {
  if (findings.length < 1) return null;

  return (
    <table
      className="usa-table usa-table--striped usa-table--borderless usa-table--stacked usa-table--compact font-body-xs width-full margin-bottom-4"
      aria-label=""
    >
      <thead>
        <tr>
          <th scope="col" className="text-no-wrap">Severity</th>
          <th scope="col" className="width-full">Finding</th>
          {hasSuppressColumn && (<th scope="col" className="text-no-wrap">Suppressed by</th>)}
        </tr>
      </thead>
      <tbody>
        {findings.map(finding => (
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
                <details>
                  <summary>
                    <b>{finding.name}</b>
                    {' on '}
                    {finding.count}
                    {plural(finding.count, ' page')}
                  </summary>
                  <ol className="font-mono-3xs">
                    {finding.urls?.map((url, i) => (
                      <li key={url} className="margin-bottom-1">
                        <ScanPagePathAndReportLink
                          pagePath={relPath(url, baseurl)}
                          reportLink={`${finding.reports[i]}#finding-${finding.id}`}
                          pageURL={url}
                        />
                      </li>
                    ))}
                  </ol>
                </details>
              )}
              {finding.anchor && (
                <>
                  <a className="usa-link text-bold" href={`#finding-${finding.anchor}`}>
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
                    {finding.ignoreSource || 'Customer criteria'}
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

const ScanFindingsSummary = ({ suppressedFindings = [], unsuppressedFindings = [], baseurl }) => (
  <>
    <h3>⚠️ Unsuppressed Results</h3>
    <ScanFindingsSummaryTable
      baseurl={baseurl}
      findings={unsuppressedFindings}
    />
    <h3>🔕  Suppressed or informational results</h3>
    <ScanFindingsSummaryTable
      baseurl={baseurl}
      findings={suppressedFindings}
      hasSuppressColumn
    />
  </>
);

ScanFindingsSummary.propTypes = {
  suppressedFindings: PropTypes.array,
  unsuppressedFindings: PropTypes.array,
  baseurl: PropTypes.string,
};

export default ScanFindingsSummary;
