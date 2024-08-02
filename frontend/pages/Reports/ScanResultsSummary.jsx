import React from 'react';
import * as utils from './utils.js';


const ScanFindingsSummaryTable = ({ title, findings, hasSuppressColumn = false, theme = 'zap'}) => { 
  if (findings.length < 1) return
  return (
    
    <table
        className="usa-table usa-table--striped usa-table--borderless usa-table--stacked usa-table--compact font-body-xs width-full margin-bottom-4"
        aria-label=""
      >
        <thead>
          <tr>
            <th scope="col">{title}</th>
            {hasSuppressColumn && ( <th scope="col" className="">Source</th> )}
            <th scope="col" className="width-card">Severity</th>
            <th scope="col" className="mobile-lg:text-right text-no-wrap width-10">Instances</th>
          </tr>
        </thead>
        <tbody>
        {findings.map((finding, index) => (
          <tr key={index}>
            <th data-label="Result name" scope="row">
              <b className="usa-sr-only">Result name: <br /></b>
              {/* this findingRef is broken */}
              <a className="usa-link" href={`#finding-${finding.ref}`}>{finding.name}</a>
            </th>
            {hasSuppressColumn && (
              <td data-label="Suppressed result" className="font-body-xs">
                {finding.ignore && (
                  <i className="text-no-wrap">
                    {' (Suppressed by '}
                    {finding.ignoreSource}
                    {')'}
                  </i>
                )}
              </td>
            )}
            <td data-label="Risk level" className="font-body-xs">
              <b className="usa-sr-only">Severity: <br /></b>
              <span className={`usa-tag radius-pill bg-${finding.severity?.color}`}>
                {finding.severity?.name}
              </span>
            </td>
            <td data-label="Instances count" className="text-right">
              <span className="usa-sr-only">{utils.plural(finding.count, 'location')}:</span>
              {finding.count}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

const ScanFindingsSummary = ({ suppressedFindings, unsuppressedFindings, scanType }) => {
  return (
    <>
      <ScanFindingsSummaryTable theme={scanType} title="Unresolved findings" findings={unsuppressedFindings}  />
      <ScanFindingsSummaryTable theme={scanType} title="Suppressed & informational results" findings={suppressedFindings} hasSuppressColumn />
    </>
  );
};

export default ScanFindingsSummary;
