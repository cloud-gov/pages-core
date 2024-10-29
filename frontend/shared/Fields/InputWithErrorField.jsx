import React from 'react';
import PropTypes from 'prop-types';

const InputWithErrorField = ({
  id,
  placeholder,
  label,
  help,
  meta: { touched, error }, // from the Field component
  input, // from the Field component
  type,
  ...props
}) => (
  <div className="padding-y-2 margin-y-neg-2 padding-x-2 margin-x-neg-2">
    {label && (
      <label className="usa-label text-bold" htmlFor={id}>
        {label}
      </label>
    )}
    {help}
    {touched && error && <span className="usa-error-message">{error}</span>}
    <input
      {...input}
      {...props}
      className={`usa-input ${touched && error ? 'usa-input--error' : ''}`}
      placeholder={placeholder}
      type={type}
      id={id}
      autoComplete="off"
    />
  </div>
);

InputWithErrorField.propTypes = {
  id: PropTypes.string.isRequired,
  placeholder: PropTypes.string,
  label: PropTypes.string,
  help: PropTypes.node,
  input: PropTypes.object.isRequired,
  meta: PropTypes.shape({
    touched: PropTypes.bool,
    error: PropTypes.string,
  }).isRequired,
  type: PropTypes.string,
};

InputWithErrorField.defaultProps = {
  help: null,
  label: null,
  placeholder: '',
  type: 'url',
};

export default InputWithErrorField;
