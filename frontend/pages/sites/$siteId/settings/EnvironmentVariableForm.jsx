import React from 'react';
import PropTypes from 'prop-types';
import { Field, reduxForm } from 'redux-form';
import InputWithErrorField from '@shared/Fields/InputWithErrorField';

export const validateName = (name) => (!name ? 'name is required' : undefined);

export const validateValue = (value) =>
  !value || value.length < 4
    ? 'value is required and must be at least 4 characters'
    : undefined;

export const EnvironmentVariableForm = ({
  handleSubmit,
  invalid,
  pristine,
  reset,
  submitting,
}) => (
  <form onSubmit={(data) => handleSubmit(data).then(reset)}>
    <fieldset className="usa-fieldset">
      <legend className="usa-sr-only">Add new environment variable</legend>
      <Field
        name="name"
        id="nameInput"
        type="text"
        label="Name:"
        className="margin-bottom-2"
        component={InputWithErrorField}
        required
        validate={[validateName]}
      />
      <Field
        name="value"
        id="valueInput"
        type="text"
        label="Value:"
        component={InputWithErrorField}
        required
        minLength={4}
        validate={[validateValue]}
      />
    </fieldset>
    <div className="usa-button-group margin-y-2 margin-x-0">
      <button
        type="button"
        className="usa-button usa-button--outline"
        disabled={pristine || submitting}
        onClick={reset}
      >
        Clear
      </button>
      <button
        type="submit"
        className="usa-button usa-button--primary"
        disabled={invalid || submitting}
      >
        Save
      </button>
    </div>
  </form>
);

EnvironmentVariableForm.propTypes = {
  handleSubmit: PropTypes.func.isRequired,
  invalid: PropTypes.bool.isRequired,
  pristine: PropTypes.bool.isRequired,
  reset: PropTypes.func.isRequired,
  submitting: PropTypes.bool.isRequired,
};

export default reduxForm({
  form: 'environmentVariable',
})(EnvironmentVariableForm);
