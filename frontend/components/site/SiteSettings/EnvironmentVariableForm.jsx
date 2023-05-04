import React from 'react';
import PropTypes from 'prop-types';
import { Field, reduxForm } from 'redux-form';
import InputWithErrorField from '../../Fields/InputWithErrorField';

export const validateName = name => (!name
  ? 'name is required'
  : undefined);

export const validateValue = value => ((!value || value.length < 4)
  ? 'value is required and must be at least 4 characters'
  : undefined);

export const EnvironmentVariableForm = ({
  handleSubmit, invalid, pristine, reset, submitting,
}) => (
  <form onSubmit={data => handleSubmit(data).then(reset)}>
    <fieldset>
      <legend className="sr-only">Add new environment variable</legend>
      <Field
        name="name"
        id="nameInput"
        type="text"
        label="Name:"
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
        minlength={4}
        validate={[validateValue]}
      />
    </fieldset>
    <button type="submit" className="usa-button usa-button-primary" disabled={invalid || submitting}>
      Add
    </button>
    <button type="button" className="usa-button usa-button-secondary" disabled={pristine || submitting} onClick={reset}>
      Clear
    </button>
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
