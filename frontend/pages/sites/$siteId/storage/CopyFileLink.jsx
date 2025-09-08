import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { IconLink } from '@shared/icons';

const CopyFileLink = ({ url }) => {
  const [copySuccess, setCopySuccess] = useState(false);
  const handleCopy = async (url) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 4000);
    } catch (err) {
      throw new Error('Failed to Copy', err);
    }
  };

  return (
    <button
      type="button"
      title="Copy full url to clipboard"
      className="usa-button usa-button--unstyled margin-right-2 text-bold"
      onClick={() => handleCopy(`${url}`)}
    >
      {copySuccess ? 'Copied!' : 'Copy link'}
      <IconLink className="usa-icon" />
    </button>
  );
};

CopyFileLink.propTypes = {
  url: PropTypes.string.isRequired,
};

export default CopyFileLink;
