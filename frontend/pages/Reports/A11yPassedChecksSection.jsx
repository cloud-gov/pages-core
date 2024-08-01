
import React from 'react';
import * as utils from './utils'

const A11yPassedChecksSection = ({ passes, url, timestamp, accumulator }) => (
  <div>
    <h2 className="font-heading-xl">Passed checks <span className="font-body-xl text-accent-cool-darker">({passes.length})</span></h2>
    <details className="margin-y-3">
      <summary>
        This page passed <b>{passes.length}</b> WCAG accessibility {utils.plural(passes.length, 'check')}.
      </summary>
      <table className="usa-table usa-table--striped usa-table--compact usa-table--borderless font-body-xs">
        <thead>
          <tr>
            <th>Description</th>
            <th>Locations</th>
          </tr>
        </thead>
        <tbody>
          {passes.map((check, index) => (
            <tr key={index}>
              <td>{check.help}.</td>
              <td className="font-mono-sm text-tabular text-right">{check.nodes.length}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </details>
    <hr />
    <p>URL scanned: <code className="narrow-mono">{url}</code></p>
    <p>
      Page {accumulator.currentPage} of {accumulator.totalPageCount} total pages scanned on {utils.timestampReadable(timestamp)}
    </p>
    <p>
      This accessibility scan is a service of <a className="usa-link" target="_blank" href="https://cloud.gov/pages/">cloud.gov Pages</a>, powered by axe-core.
    </p>
  </div>
);

export default A11yPassedChecksSection;


