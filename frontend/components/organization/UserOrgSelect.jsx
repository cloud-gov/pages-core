import React from 'react';
import PropTypes from 'prop-types';

import { ORGANIZATION } from '../../propTypes';

function makeOptions(opts) {
  return opts.map(({ id, name }) => (
    <option
      key={`org-select-${id}`}
      style={{ padding: '1rem' }}
      value={id}
    >
      {name}
    </option>
  ));
}

const UserOrgSelect = ({
  className, id, label, name, onChange, orgData, value,
}) => (
  <>
    {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
    <label htmlFor={name}>{label}</label>
    <select
      {...{ name, id, className }}
      value={value}
      onChange={onChange}
    >
      {makeOptions(orgData)}
    </select>
  </>
);

UserOrgSelect.propTypes = {
  className: PropTypes.string,
  id: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
  ]).isRequired,
  label: PropTypes.string,
  name: PropTypes.string.isRequired,
  onChange: PropTypes.func,
  orgData: PropTypes.arrayOf(ORGANIZATION).isRequired,
  value: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
  ]).isRequired,
};

UserOrgSelect.defaultProps = {
  className: 'form-control',
  label: 'Select the site\'s organization',
  onChange: () => {},
};

export default UserOrgSelect;
