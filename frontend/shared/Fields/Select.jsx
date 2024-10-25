import React from 'react';
import PropTypes from 'prop-types';

const mapOption = (option) => {
  const value = option.value || option;
  return <option key={value} value={value}>{option.label || value}</option>;
};

const Select = ({
  className,
  help,
  id,
  includeEmptyOption,
  input,
  label,
  meta: { touched, error },
  options,
}) => (
  <div>
    { label && <label className="usa-label text-bold" htmlFor={id}>{ label }</label> }
    { help }
    { touched && (error && <span className="usa-error-message">{error}</span>) }
    <select
      className={`usa-select ${touched && error ? 'usa-select--error' : ''} ${className}`}
      {...id}
      {...input}
    >
      { includeEmptyOption && <option key="" value="">--</option>}
      {options.map(mapOption)}
    </select>
  </div>
);

Select.propTypes = {
  className: PropTypes.string,
  help: PropTypes.node,
  id: PropTypes.string.isRequired,
  includeEmptyOption: PropTypes.bool,
  input: PropTypes.object.isRequired,
  label: PropTypes.string,
  meta: PropTypes.shape({
    touched: PropTypes.bool,
    error: PropTypes.string,
  }).isRequired,
  options: PropTypes.arrayOf(
    PropTypes.oneOfType([
      PropTypes.string.isRequired,
      PropTypes.shape({
        label: PropTypes.string,
        value: PropTypes.string.isRequired,
      }),
    ])
  ),
};

Select.defaultProps = {
  className: '',
  help: null,
  includeEmptyOption: false,
  label: null,
  options: [],
};

export default Select;
