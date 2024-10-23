import React from 'react';
import PropTypes from 'prop-types';

export default function DomainLink({ domain }) {
  return (
    <a
      target="_blank"
      rel="noopener noreferrer"
      title={`Link to site's domain ${domain}`}
      href={`https://${domain}`}
    >
      {domain}
    </a>
  );
}

DomainLink.propTypes = {
  domain: PropTypes.string.isRequired,
};
