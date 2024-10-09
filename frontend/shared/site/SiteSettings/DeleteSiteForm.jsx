import React from 'react';
import PropTypes from 'prop-types';
import { reduxForm } from 'redux-form';

import AlertBanner from '../../alertBanner';

export const DeleteSiteForm = ({
  handleSubmit,
  submitting,
}) => (
  <form className="settings-form settings-form-advanced" onSubmit={handleSubmit}>
    <div className="well">
      {/* DELETE SITE */}
      <fieldset className="usa-fieldset">
        <legend className="usa-sr-only">Delete Site</legend>
        <p className="well-text margin-top-0">
          Deleting a site removes the published site from our servers and
          from the dashboards of all site users.
        </p>
        <p>
          <b>This will bring the entire site offline and make it inaccessible for users.</b>
        </p>
        <AlertBanner
          status="warning"
          header="Danger zone"
          message="Are you sure you want to delete this site for all users,
                   remove all published sites, and delete all previews? Only Github repo
                   administrators can use this feature."
          alertRole={false}
        >
          <button disabled={submitting} className="usa-button usa-button--secondary margin-top-2" type="submit">
            Delete
          </button>
        </AlertBanner>
      </fieldset>
    </div>
  </form>
);

DeleteSiteForm.propTypes = {
  // the following props are from reduxForm:
  handleSubmit: PropTypes.func.isRequired,
  submitting: PropTypes.bool.isRequired,
};

// create a higher-order component with reduxForm and export that
export default reduxForm({ form: 'deleteSite' })(DeleteSiteForm);
