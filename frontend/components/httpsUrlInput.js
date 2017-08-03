import React from 'react';
import PropTypes from 'prop-types';

function onInvalidUrl(event) {
  event.target.setCustomValidity('Please enter a URL that starts with "https://"');
}

function onUrlInput(event) {
  event.target.setCustomValidity('');
}

const HttpsUrlInput = ({ placeholder, ...props }) => (
  <input
    {...props}
    type="url"
    pattern="https://.+"
    placeholder={placeholder}
    onInvalid={onInvalidUrl}
    onInput={onUrlInput}
  />
);

HttpsUrlInput.propTypes = {
  placeholder: PropTypes.string,
};

HttpsUrlInput.defaultProps = {
  placeholder: 'https://example.gov',
};

export default HttpsUrlInput;
