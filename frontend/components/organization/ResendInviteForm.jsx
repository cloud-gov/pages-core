import React from 'react';
import PropTypes from 'prop-types';
import { reduxForm } from 'redux-form';

const ResendInviteForm = ({
  handleSubmit,
  submitting,
}) => (
  <form onSubmit={handleSubmit}>
    <button
      type="submit"
      className="usa-button usa-button-secondary margin-0"
      disabled={submitting}
    >
      Resend Invite
    </button>
  </form>
);

ResendInviteForm.propTypes = {
  // the following props are from reduxForm:
  handleSubmit: PropTypes.func.isRequired,
  submitting: PropTypes.bool.isRequired,
};

export { ResendInviteForm };

export default reduxForm()(ResendInviteForm);
