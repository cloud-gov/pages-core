import React from 'react';
import PropTypes from 'prop-types';

const RenderField = ({
  id,
  meta: { touched, error }, // from the Field component
  // eslint-disable-next-line react/prop-types
  input, // from the Field component
  ...props
}) => (
  <div className={touched && error ? 'usa-input-error' : ''}>
    <label htmlFor={id}>GitHub Repository URL</label>
    <span>
      Paste your repository&apos;s GitHub URL here.
      <br />
      For example: https://github.com/18f/federalist-docs
    </span>
    {touched && (error && <span className="usa-input-error-message">{error}</span>)}
    <input
      {...input}
      {...props}
      placeholder="https://github.com/owner/repository"
      type="url"
      id={id}
      autoComplete="off"
    />
  </div>
);

RenderField.propTypes = {
  id: PropTypes.string.isRequired,
  meta: PropTypes.shape({
    touched: PropTypes.bool,
    error: PropTypes.string,
  }).isRequired,
};

export default RenderField;
