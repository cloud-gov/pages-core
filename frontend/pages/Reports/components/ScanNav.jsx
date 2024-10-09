import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { plural } from '@util/reports';
import BackToIndexButton from './BackToIndexButton';

const ScanNav = ({
  groups = [],
  generated,
  buildId,
  siteId,
  showBackButton = false,
}) => (
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
        {groups.map(({
          label, color, count = 0, usePill = false, boldMe = false,
        }) => (
          <tr className="height-5" key={label}>
            <th scope="col">
              { usePill ? (
                <a
                  href={`#${label}-findings`}
                  title={`Jump to ${label} findings`}
                  className={`usa-tag--big usa-tag text-uppercase usa-button radius-pill bg-${color}`}
                >
                  { label }
                </a>
              ) : (
                <span className={boldMe ? 'text-bold' : undefined}>
                  { label }
                </span>
              ) }
              <span className="usa-sr-only">
                {plural(count, 'findings')}
                ,
              </span>
            </th>
            <td className="font-mono-sm text-tabular text-right line-height-body-3">
              <span className={boldMe ? 'text-bold' : undefined}>
                { count }
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
    <p className="font-body-3xs line-height-body-3 maxw-card-lg">
      This report was generated for
      {' '}
      <Link reloadDocument to={`/sites/${siteId}/builds/${buildId}/logs`} className="usa-link">
        build #
        {buildId}
      </Link>
      {' '}
      scanned on
      {' '}
      {generated}
    </p>
    { showBackButton && <BackToIndexButton /> }
  </nav>
);

ScanNav.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  groups: PropTypes.array.isRequired,
  generated: PropTypes.string.isRequired,
  buildId: PropTypes.number.isRequired,
  siteId: PropTypes.number.isRequired,
  showBackButton: PropTypes.bool,
};

export default ScanNav;
