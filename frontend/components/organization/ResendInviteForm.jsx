import React from 'react';
import PropTypes from 'prop-types';
import { reduxForm } from 'redux-form';
import { IconEnvelope } from '../icons';

const ResendInviteForm = ({
  handleSubmit,
  submitting,
}) => (
  <form onSubmit={handleSubmit}>
    <button
      type="submit"
      className="usa-button usa-button--outline small-button"
      disabled={submitting}
    >
      <IconEnvelope />
      Resend invite
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
