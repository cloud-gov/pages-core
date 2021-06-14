import React from 'react';
import PropTypes from 'prop-types';
import { Field, reduxForm } from 'redux-form';
import InputWithErrorField from '../Fields/InputWithErrorField';

export const validateName = name => (!name
  ? 'name is required'
  : undefined);

const OrganizationSettingsForm = ({
  initialValues, // eslint-disable-line no-unused-vars
  invalid,
  pristine,
  handleSubmit,
  reset,
  submitting,
}) => (
  <form onSubmit={handleSubmit}>
    <fieldset>
      <legend className="usa-sr-only">Settings</legend>
      <Field
        id="name"
        name="name"
        label="Name:"
        type="text"
        component={InputWithErrorField}
        required
        minLength={4}
        validate={[validateName]}
      />
    </fieldset>
    <button
      type="submit"
      className="usa-button usa-button-primary"
      disabled={pristine || invalid || submitting}
    >
      Save settings
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

OrganizationSettingsForm.propTypes = {
  initialValues: PropTypes.shape({
    name: PropTypes.string.isRequired,
  }).isRequired,
  // the following props are from reduxForm:
  handleSubmit: PropTypes.func.isRequired,
  invalid: PropTypes.bool.isRequired,
  pristine: PropTypes.bool.isRequired,
  reset: PropTypes.func.isRequired,
  submitting: PropTypes.bool.isRequired,
};

export { OrganizationSettingsForm };

export default reduxForm({
  enableReinitialize: true,
  form: 'updateOrganization',
})(OrganizationSettingsForm);
