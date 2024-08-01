
import React from 'react';
import PropTypes from 'prop-types';
import * as utils from './utils.js';

const ScanNav = ({ groups, generated, buildId }) => {
  return (
    <nav className="sticky">
      <table className="width-full desktop:width-auto usa-table usa-table--compact usa-table--borderless summary-table">
        <caption className="usa-sr-only">Summary by severity</caption>
        <thead>
          <tr className="height-5">
            <th scope="col" role="columnheader">Severity</th>
            <th className="text-right" scope="col" role="columnheader">Count</th>
          </tr>
        </thead>
        <tbody>
          {groups.map(({ label, name, color, count = 0, usePill = false, boldMe = false }, index) => (
                <tr className="height-5" key={index}>
                  <th scope="col">
                    { usePill ? <>
                      <a
                        href={`#${name}-findings`}
                        title={`Jump to ${name} findings`}
                        className={`usa-tag--big usa-tag text-uppercase usa-button radius-pill bg-${color}`}
                      >
                        { label }
                      </a>
                    </> : <>
                      <span className={boldMe ? 'text-bold' : undefined}>
                        { label }
                      </span>
                    </> }
                    <span className="usa-sr-only">
                      {utils.plural(count, 'findings')},
                    </span>
                  </th>
                  <td scope="col" className="font-mono-sm text-tabular text-right line-height-body-3">
                      <span className={boldMe ? 'text-bold' : undefined}>
                        { count }
                      </span>
                  </td>
                </tr>
            ))
          }
        </tbody>
      </table>
      <p className="font-body-3xs line-height-body-3 maxw-card-lg">
        Scanned {generated} during Pages Build ID: <span className="font-mono-3xs">#{buildId}</span>
      </p>
    </nav>
  );
};

ScanNav.propTypes = {
  groups: PropTypes.array.isRequired,
  generated: PropTypes.string.isRequired,
  buildId: PropTypes.string.isRequired,
};

export default ScanNav;
