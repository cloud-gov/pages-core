
import React from 'react';
import * as utils from './utils'

const A11ySummaryTable = ({ violationsCount, groupedViolations, timestamp, buildId, passes }) => (
  <section className="desktop:grid-col-auto">
    <nav className="sticky">
      <table className="width-full desktop:width-auto usa-table usa-table--compact usa-table--borderless summary-table">
        <caption className="usa-sr-only">
          Summary of violations by severity and count
        </caption>
        <thead>
          <tr className="height-5">
            <th scope="col" role="columnheader">Severity</th>
            <th className="text-right" scope="col" role="columnheader">Count</th>
          </tr>
        </thead>
        <tbody>
          {violationsCount > 0 && groupedViolations && Object.keys(groupedViolations).map(group => (
            <tr className="height-5" key={group}>
              <th scope="col">
                <a href={`#${group}-violations`} title={`Jump to ${group} violations`} className={`usa-tag--big usa-tag text-uppercase usa-button radius-pill bg-${utils.getMatchingSeverity(group).color}`}>
                  {group}
                  <span className="usa-sr-only"> {utils.plural(group.length, 'violation')},</span>
                </a>
              </th>
              <td scope="col" className="font-mono-sm text-tabular text-right line-height-body-3">
                {groupedViolations[group].length}
              </td>
            </tr>
          ))}
          <tr className="height-5">
            <th scope="col"><b>Total violations</b></th>
            <td scope="col" className="font-mono-sm text-tabular text-right line-height-body-3">
              <b>{violationsCount}</b>
            </td>
          </tr>
          <tr className="height-5">
            <th scope="col">Total passes</th>
            <td scope="col" className="font-mono-sm text-tabular text-right line-height-body-3">
              {passes.length}
            </td>
          </tr>
        </tbody>
      </table>
      <p className="font-body-3xs line-height-body-3 maxw-card-lg">
        Scanned {utils.timestampReadable(timestamp)} during Pages Build ID: <span className="font-mono-3xs">#{buildId}</span>
      </p>
      <a href="./index.html" className="usa-link">&LeftAngleBracket; Back to scan results index</a>
    </nav>
  </section>
);

export default A11ySummaryTable;
