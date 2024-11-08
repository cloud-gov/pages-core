import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

const GeneratedFor = ({ siteId, buildId, url, timestamp, topClass }) => (
  <p className={`font-body-xs ${topClass}`}>
    This report was generated for{' '}
    <code className="narrow-mono font-mono-2xs bg-accent-cool-lighter">{url}</code>
    {' from '}
    <Link
      reloadDocument
      to={`/sites/${siteId}/builds/${buildId}/logs`}
      className="usa-link"
    >
      build #{buildId}
    </Link>{' '}
    scanned on {timestamp}
  </p>
);

GeneratedFor.propTypes = {
  siteId: PropTypes.number.isRequired,
  buildId: PropTypes.number.isRequired,
  url: PropTypes.string.isRequired,
  timestamp: PropTypes.string.isRequired,
  topClass: PropTypes.string.isRequired,
};

export default GeneratedFor;
