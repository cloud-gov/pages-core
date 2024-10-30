import React from 'react';
import PropTypes from 'prop-types';
import { reduxForm } from 'redux-form';

const RemoveUserForm = ({ handleSubmit, submitting }) => (
  <form onSubmit={handleSubmit}>
    <button
      type="submit"
      className="usa-button usa-button--secondary margin-bottom-1 small-button"
      disabled={submitting}
    >
      Remove
    </button>
  </form>
);

RemoveUserForm.propTypes = {
  // the following props are from reduxForm:
  handleSubmit: PropTypes.func.isRequired,
  submitting: PropTypes.bool.isRequired,
};

export { RemoveUserForm };

export default reduxForm()(RemoveUserForm);
