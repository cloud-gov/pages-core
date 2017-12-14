import React from 'react';
import PropTypes from 'prop-types';

const RenderField = ({
  id,
  placeholder,
  label,
  help,
  meta: { touched, error }, // from the Field component
  // eslint-disable-next-line react/prop-types
  input, // from the Field component
  ...props
}) => (
  <div className={touched && error ? 'usa-input-error' : ''}>
    { label && <label htmlFor={id}>{ label }</label> }
    { help }
    {touched && (error && <span className="usa-input-error-message">{error}</span>)}
    <input
      {...input}
      {...props}
      placeholder={placeholder}
      type="url"
      id={id}
      autoComplete="off"
    />
  </div>
);

RenderField.propTypes = {
  id: PropTypes.string.isRequired,
  placeholder: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  help: PropTypes.node,
  meta: PropTypes.shape({
    touched: PropTypes.bool,
    error: PropTypes.string,
  }).isRequired,
};

RenderField.defaultProps = {
  help: null,
};

export default RenderField;
