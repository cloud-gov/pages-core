import React from 'react';
import PropTypes from 'prop-types';
import { Field, reduxForm } from 'redux-form';
import InputWithErrorField from '../../Fields/InputWithErrorField';
import { validBasicAuthUsername, validBasicAuthPassword } from '../../../util/validators';

export const BasicAuthSettingsForm = ({
  handleSubmit, invalid, pristine, submitting,
}) => (
  <form className="settings-form" onSubmit={data => handleSubmit(data)}>
    <h3>Basic Authentication Settings</h3>
    <div className="well">
      <fieldset>
        <p className="well-text">
          To enable basic authentication, please submit a username and password
          credentials required to preview your site builds.
        </p>
        <Field
          name="username"
          type="text"
          label="Username:"
          component={InputWithErrorField}
          required
          validate={[validBasicAuthUsername]}
          id="basicAuthUsernameInput"
        />
        <Field
          name="password"
          type="password"
          label="Password:"
          component={InputWithErrorField}
          required
          validate={[validBasicAuthPassword]}
          id="basicAuthPasswordInput"
        />
      </fieldset>
      <button type="submit" disabled={invalid || pristine || submitting}>
        Save
      </button>
    </div>
  </form>
);

BasicAuthSettingsForm.propTypes = {
  handleSubmit: PropTypes.func.isRequired,
  invalid: PropTypes.bool.isRequired,
  pristine: PropTypes.bool.isRequired,
  submitting: PropTypes.bool.isRequired,
};

export default reduxForm({
  form: 'basicAuth',
  enableReinitialize: true,
})(BasicAuthSettingsForm);
