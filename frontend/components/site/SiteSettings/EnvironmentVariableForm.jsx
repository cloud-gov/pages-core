import React from 'react';
import PropTypes from 'prop-types';
import { Field, reduxForm } from 'redux-form';
import InputWithErrorField from '../../Fields/InputWithErrorField';

export const EnvironmentVariableForm = ({
  handleSubmit, pristine, reset, submitting,
}) => (
  <form onSubmit={handleSubmit}>
    <fieldset>
      <legend className="sr-only">Add new environment variable</legend>
      <Field
        name="name"
        type="text"
        label="Name:"
        component={InputWithErrorField}
      />
      <Field
        name="value"
        type="text"
        label="Value:"
        component={InputWithErrorField}
      />
    </fieldset>
    <button type="submit" disabled={submitting}>
      Add
    </button>
    <button type="button" disabled={pristine || submitting} onClick={reset}>
      Clear
    </button>
  </form>
);

EnvironmentVariableForm.propTypes = {
  handleSubmit: PropTypes.func.isRequired,
  pristine: PropTypes.bool.isRequired,
  reset: PropTypes.func.isRequired,
  submitting: PropTypes.bool.isRequired,
};

export default reduxForm({
  form: 'environmentVariable',
})(EnvironmentVariableForm);
