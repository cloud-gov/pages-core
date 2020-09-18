import React from 'react';
import PropTypes from 'prop-types';
import { reduxForm } from 'redux-form';

import AlertBanner from '../../alertBanner';

export const DeleteSiteForm = ({
  siteId,
  handleSubmit,
  submitting,
}) => (
  <form className="settings-form settings-form-advanced" onSubmit={handleSubmit}>
    <div className="well">
      {/* DELETE SITE */}
      <fieldset>
        <legend>Delete Site</legend>
        <p className="well-text">
          Deleting a Federalist site removes the published site from our servers and
          disconnects the Federalist admin interface for all users. This will bring the
          entire site offline and make it inaccessible for users.
          <br />
          <br />
          {' '}
          <i>
            Trying to remove a site from your list of Federalist sites? Go to the
            {' '}
            <a href={`/sites/${siteId}/users`}>collaborators page</a>
            {' '}
            and remove yourself.
          </i>
        </p>
        <AlertBanner
          status="warning"
          header="Danger zone"
          message="Are you sure you want to delete this site from Federalist for all users,
                   remove all published sites, and delete all previews? Only Github repo
                   administrators can use this feature."
          alertRole={false}
        >
          <button disabled={submitting} className="usa-button usa-button-red" type="submit">
            Delete
          </button>
        </AlertBanner>
      </fieldset>
    </div>
  </form>
);

DeleteSiteForm.propTypes = {
  siteId: PropTypes.number.isRequired,

  // the following props are from reduxForm:
  handleSubmit: PropTypes.func.isRequired,
  submitting: PropTypes.bool.isRequired,
};

// create a higher-order component with reduxForm and export that
export default reduxForm({ form: 'deleteSite' })(DeleteSiteForm);
