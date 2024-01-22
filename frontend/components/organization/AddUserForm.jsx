/* eslint-disable react/forbid-prop-types */

import React from 'react';
import PropTypes from 'prop-types';
import { Field, reduxForm } from 'redux-form';
import InputWithErrorField from '../Fields/InputWithErrorField';
import Select from '../Fields/Select';

export const validateEmail = email => (!email
  ? 'email is required'
  : undefined);

function validateRole(roleId, _, { roleOptions }) {
  return roleOptions.map(opt => `${opt.value}`).includes(roleId)
    ? undefined
    : 'Please select a role';
}

const AddUserForm = ({
  className,
  invalid,
  pristine,
  handleSubmit,
  reset,
  roleOptions,
  submitting,
}) => (
  <form className={className} onSubmit={data => handleSubmit(data).then(reset)}>
    <fieldset>
      <legend className="usa-sr-only">Add user</legend>
      <Field
        id="uaaEmail"
        name="uaaEmail"
        type="email"
        label="Email:"
        component={InputWithErrorField}
        required
        minLength={4}
        validate={[validateEmail]}
      />
      <Field
        id="roleId"
        name="roleId"
        component={Select}
        includeEmptyOption
        label="Role:"
        options={roleOptions}
        validate={[validateRole]}
      />
    </fieldset>
    <button
      type="submit"
      className="usa-button usa-button-primary"
      disabled={pristine || invalid || submitting}
    >
      Invite
    </button>
    <button
      type="button"
      className="usa-button usa-button-secondary"
      disabled={pristine || submitting}
      onClick={reset}
    >
      Cancel
    </button>
  </form>
);

AddUserForm.propTypes = {
  className: PropTypes.string,
  // the following props are from reduxForm:
  handleSubmit: PropTypes.func.isRequired,
  invalid: PropTypes.bool.isRequired,
  pristine: PropTypes.bool.isRequired,
  reset: PropTypes.func.isRequired,
  roleOptions: PropTypes.arrayOf(
    PropTypes.object
  ).isRequired,
  submitting: PropTypes.bool.isRequired,
};

AddUserForm.defaultProps = {
  className: '',
};

export { AddUserForm };

export default reduxForm({
  form: 'addUserToOrganization',
})(AddUserForm);
