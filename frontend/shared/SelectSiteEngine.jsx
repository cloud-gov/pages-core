import React from 'react';
import PropTypes from 'prop-types';

export const availableEngines = [
  {
    label: 'Hugo',
    value: 'hugo',
  },
  {
    label: 'Jekyll',
    value: 'jekyll',
  },
  {
    label: 'Node.js',
    value: 'node.js',
  },
  {
    label: 'Static HTML',
    value: 'static',
  },
];

function makeOptions(opts) {
  return [
    <option key="" value="" disabled>
      Please select a site engine
    </option>,
    ...opts.map(({ label, value }) => (
      <option key={value} value={value}>
        {label}
      </option>
    )),
  ];
}

const SelectSiteEngine = ({
  value,
  onChange,
  name,
  id,
  className,
  touched = false,
  error,
}) => {
  return (
    <>
      {touched && error && <span className="usa-error-message">{error}</span>}
      <select
        className={`usa-select ${className}`}
        {...{ name, id }}
        value={value}
        onChange={onChange}
      >
        {makeOptions(availableEngines)}
      </select>
    </>
  );
};

SelectSiteEngine.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func,
  name: PropTypes.string.isRequired,
  id: PropTypes.string.isRequired,
  className: PropTypes.string,
  touched: PropTypes.bool,
  error: PropTypes.string,
};

export default SelectSiteEngine;
