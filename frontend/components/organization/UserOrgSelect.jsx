import React from 'react';
import PropTypes from 'prop-types';

import { ORGANIZATION } from '../../propTypes';

function makeOptions(opts) {
  return opts.map(({ id, name }) => (
    <option
      key={`org-select-${id}`}
      className="user-org-select-option"
      value={id}
    >
      {name}
    </option>
  ));
}

const UserOrgSelect = ({
  className,
  id,
  label,
  touched,
  error,
  mustChooseOption,
  name,
  onChange,
  orgData,
  value,
}) => (
  <div>
    {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
    <label htmlFor={name} className="usa-label text-bold">{label}</label>
    {touched && (error && <span className="usa-error-message">{error}</span>)}
    <select
      {...{ name, id }}
      value={value}
      onChange={onChange}
      className={`usa-select ${touched && error ? 'usa-select--error' : ''} ${className}`}
    >
      {
        mustChooseOption ? (
          <option
            className="user-org-select-option"
            value=""
          >
            Please select an organization
          </option>
        ) : null
      }
      {makeOptions(orgData)}
    </select>
  </div>
);

UserOrgSelect.propTypes = {
  className: PropTypes.string,
  id: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
  ]).isRequired,
  label: PropTypes.string,
  touched: PropTypes.bool,
  error: PropTypes.string,
  mustChooseOption: PropTypes.bool,
  name: PropTypes.string.isRequired,
  onChange: PropTypes.func,
  orgData: PropTypes.arrayOf(ORGANIZATION).isRequired,
  value: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
  ]).isRequired,
};

UserOrgSelect.defaultProps = {
  className: null,
  label: 'Select the site\'s organization',
  touched: false,
  error: null,
  mustChooseOption: false,
  onChange: () => {},
};

export default UserOrgSelect;
