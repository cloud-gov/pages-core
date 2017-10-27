import React from 'react';
import PropTypes from 'prop-types';


function createOnInvalidHandler(message) {
  return (event) => {
    event.target.setCustomValidity(message);
  };
}

function resetValidity(event) {
  event.target.setCustomValidity('');
}

const HttpsUrlInput = ({ placeholder, pattern, invalidMessage, ...props }) => (
  <input
    {...props}
    type="url"
    pattern={pattern}
    placeholder={placeholder}
    onInvalid={createOnInvalidHandler(invalidMessage)}
    onInput={resetValidity}
  />
);

HttpsUrlInput.propTypes = {
  placeholder: PropTypes.string,
  invalidMessage: PropTypes.string,
  pattern: PropTypes.string,
};

HttpsUrlInput.defaultProps = {
  placeholder: 'https://example.gov',
  invalidMessage: 'Please enter a URL that starts with "https://" and has no trailing path',
  pattern: 'https://.+\\.\\w{2,}',
};

export default HttpsUrlInput;
