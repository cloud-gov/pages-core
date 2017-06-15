import React from 'react';
import PropTypes from 'prop-types';

const availableEngines = [
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

const SelectSiteEngine = ({ value, onChange }) => (
  <div>
    <label htmlFor="engine">Static site engine</label>
    <select
      name="engine"
      id="engine"
      className="form-control"
      value={value}
      onChange={onChange}
    >
      {makeOptions(availableEngines)}
    </select>
  </div>
);


SelectSiteEngine.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func,
};

SelectSiteEngine.defaultProps = {
  onChange: () => {},
};

export default SelectSiteEngine;
