import React from 'react';
import PropTypes from 'prop-types';

export const availableEngines = [
  {
    label: 'Jekyll',
    value: 'jekyll',
  },
  {
    label: 'Hugo (experimental)',
    value: 'hugo',
  },
  {
    label: 'Static (just publish the files in the repository)',
    value: 'static',
  },
];

function makeOptions(opts) {
  return opts.map(({ label, value }) => (
    <option key={value} value={value}>{label}</option>
  ));
}

const SelectSiteEngine = ({ value, onChange, ...props }) => (
  <select
    {...props}
    className="form-control"
    value={value}
    onChange={onChange}
  >
    {makeOptions(availableEngines)}
  </select>
);

SelectSiteEngine.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func,
};

SelectSiteEngine.defaultProps = {
  onChange: () => {},
};

export default SelectSiteEngine;
