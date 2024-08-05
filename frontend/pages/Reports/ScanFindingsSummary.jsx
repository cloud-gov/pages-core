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
              {finding.ref && (
                <a className="usa-link" href={finding.ref}>
                  {finding.name}&nbsp;
                  <svg className="usa-icon text-ttop" xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24">
                    <path fill="currentColor" d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"></path>
                  </svg>
                </a>
              )}
              {finding.anchor && (
                <a className="usa-link" href={`#finding-${finding.anchor}`}>{finding.name}</a>                
              )}
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
