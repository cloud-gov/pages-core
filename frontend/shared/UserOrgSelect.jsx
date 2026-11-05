import React from 'react';
import PropTypes from 'prop-types';

import { ORGANIZATION } from '../propTypes';

function makeOptions(opts) {
  return opts.map(({ id, name }) => (
    <option key={`org-select-${id}`} className="user-org-select-option" value={id}>
      {name}
    </option>
  ));
}

/**
 * @param {Object} props
 * @param {string} [props.className]
 * @param {string|number} props.id
 * @param {string} [props.label]
 * @param {boolean} [props.touched]
 * @param {string} [props.error]
 * @param {boolean} [props.mustChooseOption]
 * @param {string} props.name
 * @param {Function} props.onChange
 * @param {Array} props.orgData
 * @param {string|number} props.value
 */
const UserOrgSelect = ({
  className = '',
  id,
  label = "Select the site's organization",
  touched = false,
  error,
  mustChooseOption = false,
  name,
  onChange,
  orgData,
  value,
}) => (
  <div>
    {/* @ts-expect-error */}
    <label htmlFor={id} className="usa-label text-bold">
      {label}
    </label>
    {touched && error && <span className="usa-error-message">{error}</span>}
    <select
      {...{ name, id }}
      value={value}
      // @ts-expect-error
      onChange={onChange}
      className={`usa-select ${touched && error ? 'usa-select--error' : ''} ${className}`}
    >
      {mustChooseOption ? (
        <option className="user-org-select-option" value="">
          - Select an organization -
        </option>
      ) : null}
      {makeOptions(orgData)}
    </select>
  </div>
);

UserOrgSelect.propTypes = {
  className: PropTypes.string,
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  label: PropTypes.string,
  touched: PropTypes.bool,
  error: PropTypes.string,
  mustChooseOption: PropTypes.bool,
  name: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  orgData: PropTypes.arrayOf(ORGANIZATION).isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
};

export default UserOrgSelect;
