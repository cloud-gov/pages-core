/* eslint-disable react/forbid-prop-types */

import React from 'react';
import PropTypes from 'prop-types';
import { Field, reduxForm } from 'redux-form';
import Select from '@shared/Fields/Select';

function validateRole(roleId, _, { roleOptions }) {
  return roleOptions.map(opt => `${opt.value}`).includes(roleId)
    ? undefined
    : 'Please select a role';
}

const UpdateUserForm = ({
  initialValues, // eslint-disable-line no-unused-vars
  invalid,
  pristine,
  handleSubmit,
  roleOptions,
  submitting,
}) => (
  <form
    onSubmit={handleSubmit}
    className="update-user-form"
  >
    <fieldset className="usa-fieldset margin-right-1 display-inline">
      <legend className="usa-sr-only">Update user role</legend>
      <Field
        id="roleId"
        name="roleId"
        component={Select}
        options={roleOptions}
        validate={[validateRole]}
      />
    </fieldset>
    <button
      type="submit"
      className="usa-button usa-button--primary margin-0"
      disabled={pristine || invalid || submitting}
    >
      Update
    </button>
  </form>
);

UpdateUserForm.propTypes = {
  // the following props are from reduxForm:
  handleSubmit: PropTypes.func.isRequired,
  initialValues: PropTypes.shape({
    roleId: PropTypes.number.isRequired,
  }).isRequired,
  invalid: PropTypes.bool.isRequired,
  pristine: PropTypes.bool.isRequired,
  roleOptions: PropTypes.arrayOf(
    PropTypes.object
  ).isRequired,
  submitting: PropTypes.bool.isRequired,
};

export { UpdateUserForm };

export default reduxForm({
  enableReinitialize: true,
})(UpdateUserForm);
