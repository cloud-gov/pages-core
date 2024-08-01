
import React from 'react';
import PropTypes from 'prop-types';
import * as utils from './utils.js';

const ScanNav = ({ alerts, groupedAlerts, site, generated, buildId }) => {
  return (
    <nav className="sticky">
      <table className="width-full desktop:width-auto usa-table usa-table--compact usa-table--borderless summary-table">
        <caption className="usa-sr-only">Summary by risk level</caption>
        <thead>
          <tr className="height-5">
            <th scope="col" role="columnheader">Risk level</th>
            <th className="text-right" scope="col" role="columnheader">Count</th>
          </tr>
        </thead>
        <tbody>
          {alerts.length && groupedAlerts &&
            Object.values(utils.severity).map(({ riskCode, name, color }) => (
              groupedAlerts[riskCode] ? (
                <tr className="height-5" key={riskCode}>
                  <th scope="col">
                    <a
                      href={`#${name}-findings`}
                      title={`Jump to ${name} findings`}
                      className={`usa-tag--big usa-tag text-uppercase usa-button radius-pill bg-${color}`}
                    >
                      {name}
                      {riskCode > 0 && ' risk'}
                      <span className="usa-sr-only">
                        {utils.plural(groupedAlerts[riskCode].length, 'findings')},
                      </span>
                    </a>
                  </th>
                  <td scope="col" className="font-mono-sm text-tabular text-right line-height-body-3">
                    {groupedAlerts[riskCode].length}
                  </td>
                </tr>
              ) : null
            ))
          }
          <tr className="height-5">
            <th scope="col"><b>All warnings</b></th>
            <td scope="col" className="font-mono-sm text-tabular text-right line-height-body-3">
              <b>{site.issueCount}</b>
            </td>
          </tr>
          <tr className="height-5">
            <th scope="col">Total findings</th>
            <td scope="col" className="font-mono-sm text-tabular text-right line-height-body-3">
              {alerts.length}
            </td>
          </tr>
        </tbody>
      </table>
      <p className="font-body-3xs line-height-body-3 maxw-card-lg">
        Scanned {generated} during Pages Build ID: <span className="font-mono-3xs">#{buildId}</span>
      </p>
    </nav>
  );
};

ScanNav.propTypes = {
  alerts: PropTypes.array.isRequired,
  groupedAlerts: PropTypes.object.isRequired,
  site: PropTypes.object.isRequired,
  generated: PropTypes.string.isRequired,
  buildId: PropTypes.string.isRequired,
};

export default ScanNav;
