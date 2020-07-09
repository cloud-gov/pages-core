import React from 'react';
import PropTypes from 'prop-types';
import { reduxForm } from 'redux-form';
import { BASIC_AUTH } from '../../../propTypes';



export const BasicAuthSettingsDisable = ({
  handleSubmit, submitting, initialValues,
}) => (
  <form className="settings-form" onSubmit={data => handleSubmit(data)}>
    <h3>Basic Authentication Settings</h3>
    <div className="well">
      <fieldset>
        <p className="well-text">
          <b>Username:</b> {username}<br />
          <b>Password:</b> {password}<br /><br />
        </p>
      </fieldset>
      <button type="submit" disabled={submitting} className="margin-0" name="disable-basic-auth">Disable</button>
    </div>
  </form>
);

BasicAuthSettingsDisable.propTypes = {
  handleSubmit: PropTypes.func.isRequired,
  submitting: PropTypes.bool.isRequired,
  initialValues: BASIC_AUTH.isRequired,
};

export default reduxForm({
  form: 'basicAuthDisable',
  // enableReinitialize: true,
})(BasicAuthSettingsDisable);
