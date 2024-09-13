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
  return opts.map(({ label, value }) => (
    <option key={value} value={value}>{label}</option>
  ));
}

const SelectSiteEngine = ({
  value, onChange, name, id, className,
}) => (
  <select
    className="usa-select"
    {...{ name, id, className }}
    value={value}
    onChange={onChange}
  >
    {makeOptions(availableEngines)}
  </select>
);

SelectSiteEngine.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func,
  name: PropTypes.string.isRequired,
  id: PropTypes.string.isRequired,
  className: PropTypes.string,
};

SelectSiteEngine.defaultProps = {
  className: '',
  onChange: () => {},
};

export default SelectSiteEngine;
