import React from 'react';
import PropTypes from 'prop-types';
import { reduxForm } from 'redux-form';

import HttpsUrlField from '../../Fields/HttpsUrlField';
import BranchField from '../../Fields/BranchField';
import globals from '../../../globals';

export const BasicSiteSettings = ({
  // even though initialValues is not directly used, it is used
  // by reduxForm, and we want PropType validation on it, so we'll
  // keep it here but disable the eslint rule below
  initialValues, // eslint-disable-line no-unused-vars
  reset,
  pristine,
  handleSubmit,
  isSandbox,
}) => (
  <form className="settings-form" onSubmit={handleSubmit}>
    <h3>Basic settings</h3>
    <div className="well">
      <fieldset>
        <legend>Live site</legend>
        <p className="well-text">
          Set the primary branch
          {globals.APP_NAME}
          uses to build your site.
          After your DNS is pointed to
          {`${globals.APP_NAME},`}
          you&apos;ll set the
          {' '}
          <a
            href="https://federalist.18f.gov/documentation/custom-domains/#update-your-site-settings"
            target="_blank"
            rel="noopener noreferrer"
            title="Custom URL documentation"
          >
            live URL
          </a>
          {' '}
          to ensure the site builds correctly.
        </p>
        <BranchField
          label="Branch name:"
          type="text"
          id="defaultBranchInput"
          name="defaultBranch"
          className="form-control"
          placeholder="Branch name"
        />
        {!isSandbox
          && (
          <HttpsUrlField
            label="Live URL:"
            name="domain"
            id="domainInput"
            placeholder="https://example.gov"
            className="form-control"
            disabled={!initialValues.canEditLiveUrl}
          />
          )}
      </fieldset>
    </div>
    <div className="well">
      <fieldset>
        <legend>Demo site</legend>
        <p className="well-text">
          Optional: After setting up DNS with the
          {globals.APP_NAME}
          team, set a demo branch
          to be deployed to a custom URL like
          {' '}
          <code>demo.example.gov</code>
          {' '}
          instead of a standard
          {globals.APP_NAME}
          preview URL.
        </p>
        <BranchField
          label="Branch name:"
          name="demoBranch"
          id="demoBranchInput"
          className="form-control"
          type="text"
          placeholder="Branch name"
        />
        {!isSandbox
          && (
          <HttpsUrlField
            label="Demo URL:"
            name="demoDomain"
            id="demoDomainInput"
            placeholder="https://demo.example.gov"
            className="form-control"
            disabled={!initialValues.canEditDemoUrl}
          />
          )}
      </fieldset>
    </div>
    <button
      type="button"
      className="usa-button usa-button-secondary"
      disabled={pristine}
      onClick={reset}
    >
      Reset
    </button>

    <button
      type="submit"
      className="usa-button usa-button-primary"
      disabled={pristine}
    >
      Save basic settings
    </button>
  </form>
);

BasicSiteSettings.propTypes = {
  // initialValues is what the initial form values are based on
  initialValues: PropTypes.shape({
    defaultBranch: PropTypes.string,
    domain: PropTypes.string,
    demoBranch: PropTypes.string,
    demoDomain: PropTypes.string,
    canEditLiveUrl: PropTypes.bool,
    canEditDemoUrl: PropTypes.bool,
  }).isRequired,

  // the following props are from reduxForm:
  handleSubmit: PropTypes.func.isRequired,
  reset: PropTypes.func.isRequired,
  pristine: PropTypes.bool.isRequired,
  isSandbox: PropTypes.bool.isRequired,
};

// create a higher-order component with reduxForm and export that
export default reduxForm({ form: 'basicSiteSettings' })(BasicSiteSettings);
