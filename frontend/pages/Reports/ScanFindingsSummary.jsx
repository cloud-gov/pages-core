import React from 'react';
import * as utils from './utils.js';

const ScanFindingsSummary = ({ alerts }) => {
  return (
    <>
      <h2 className="font-heading-xl margin-bottom-1 margin-top-3">Findings summary</h2>
      <table
        className="usa-table usa-table--striped usa-table--borderless usa-table--stacked usa-table--compact font-body-xs width-full margin-bottom-8"
        aria-label=""
      >
        <thead>
          <tr>
            <th scope="col">Finding</th>
            <th scope="col" className="text-no-wrap width-15 desktop:width-card-lg">Risk level</th>
            <th scope="col" className="mobile-lg:text-right text-no-wrap width-10">Locations</th>
          </tr>
        </thead>
        <tbody>
        {alerts.map((alert, index) => (
          <tr key={index}>
            <th data-label="Finding" scope="row">
              <b className="usa-sr-only">Finding: <br /></b>
              <a className="usa-link" href={`#alert-${alert.alertRef}`}>{alert.name}</a>
            </th>
            <td data-label="Risk level" className="font-body-xs text-no-wrap">
              <b className="usa-sr-only">Risk level: <br /></b>
              <span className={`usa-tag radius-pill bg-${utils.getSevByRiskCode(alert.riskcode).color}`}>
                {utils.getSevByRiskCode(alert.riskcode).name}
              </span>
            </td>
            <td data-label="Locations count" className="text-right">
              <span className="usa-sr-only">{utils.plural(alert.instances.length, 'location')}:</span>
              {alert.instances.length}
            </td>
          </tr>
        ))}
      </tbody>

      </table>
    </>
  );
};

export default ScanFindingsSummary;
