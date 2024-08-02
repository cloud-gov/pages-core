import React from 'react';
import * as utils from './utils.js';

const ScanFindingsSummary = ({ findings, children }) => {
  // TODO: do  suppressed/unsuppressed before it gets to this component, update alert component
  function splitSuppressedResults(array, isValid) {
  return array.reduce(([pass, fail], elem) => {
      return isValid(elem) ? [[...pass, elem], fail] : [pass, [...fail, elem]];
    }, [[], []]);
  }
  const [ suppressedFindings, unsuppressedFindings ] = splitSuppressedResults(findings, finding => finding.ignore || finding?.riskcode < 1);

  return (
    <>
      <h2 className="font-heading-xl margin-bottom-1 margin-top-3">Scan results summary</h2>

      {children}
      
      <table
        className="usa-table usa-table--striped usa-table--borderless usa-table--stacked usa-table--compact font-body-xs width-full margin-bottom-4"
        aria-label=""
      >
        <thead>
          <tr>
            <th scope="col">Unresolved findings</th>
            <th scope="col">Severity</th>
            <th scope="col" className="mobile-lg:text-right text-no-wrap width-10">Instances</th>
          </tr>
        </thead>
        <tbody>
        {unsuppressedFindings.map((finding, index) => (
          <tr key={index}>
            <th data-label="Result name" scope="row">
              <b className="usa-sr-only">Result name: <br /></b>
              <a className="usa-link" href={`#finding-${finding.findingRef}`}>{finding.name}</a>
            </th>
            <td data-label="Severity" className="font-body-xs">
              <b className="usa-sr-only">Severity: <br /></b>
              <span className={`usa-tag radius-pill bg-${utils.getSevByRiskCode(finding.riskcode).color}`}>
                {utils.getSevByRiskCode(finding.riskcode).name}
              </span>
            </td>
            <td data-label="Instances count" className="text-right">
              <span className="usa-sr-only">{utils.plural(finding.instances.length, 'location')}:</span>
              {finding.instances.length}
            </td>
          </tr>
        ))}
      </tbody>

      </table>

      <table
        className="usa-table usa-table--striped usa-table--borderless usa-table--stacked usa-table--compact font-body-xs width-full margin-bottom-4"
        aria-label=""
      >
        <thead>
          <tr>
            <th scope="col">Suppressed & informational results</th>
            <th scope="col" className="">Source</th>
            <th scope="col" className="width-card tablet:width-auto">Severity</th>
            <th scope="col" className="mobile-lg:text-right text-no-wrap width-10">Instances</th>
          </tr>
        </thead>
        <tbody>
        {suppressedFindings.map((finding, index) => (
          <tr key={index}>
            <th data-label="Result name" scope="row">
              <b className="usa-sr-only">Result name: <br /></b>
              <a className="usa-link" href={`#finding-${finding.findingRef}`}>{finding.name}</a>
            </th>
            <td data-label="Risk level" className="font-body-xs">
              {finding.ignore && (
                <i className="text-no-wrap">
                  {' (Suppressed by '}
                  {finding.ignoreSource}
                  {')'}
                </i>
              )}
            </td>
            <td data-label="Risk level" className="font-body-xs">
              <b className="usa-sr-only">Severity: <br /></b>
              <span className={`usa-tag radius-pill bg-${utils.getSevByRiskCode(finding.riskcode).color}`}>
                {utils.getSevByRiskCode(finding.riskcode).name}
              </span>
            </td>
            <td data-label="Instances count" className="text-right">
              <span className="usa-sr-only">{utils.plural(finding.instances.length, 'location')}:</span>
              {finding.instances.length}
            </td>
          </tr>
        ))}
      </tbody>

      </table>
    </>
  );
};

export default ScanFindingsSummary;
