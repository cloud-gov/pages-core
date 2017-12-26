import React from 'react';
import PropTypes from 'prop-types';
import { Field, reduxForm } from 'redux-form';

import HttpsUrlField from '../../Fields/HttpsUrlField';

const propTypes = {
  // initialValues is what the initial form values are based on
  initialValues: PropTypes.shape({
    defaultBranch: PropTypes.string,
    domain: PropTypes.string,
    demoBranch: PropTypes.string,
    demoDomain: PropTypes.string,
  }).isRequired,

  // the following props are from reduxForm:
  handleSubmit: PropTypes.func.isRequired,
  reset: PropTypes.func.isRequired,
  pristine: PropTypes.bool.isRequired,
};

export const BasicSiteSettings = ({
  // even though initialValues is not directly used, it is used
  // by reduxForm, and we want PropType validation on it, so we'll
  // keep it here but disable the eslint rule below
  initialValues, // eslint-disable-line no-unused-vars
  reset,
  pristine,
  handleSubmit,
}) => (
  <form className="settings-form" onSubmit={handleSubmit}>
    <div className="usa-grid">
      <div className="usa-width-one-whole">
        <div className="form-group">
          <div className="well">
            <h3 className="well-heading">Live Site</h3>
            <p className="well-text">
              These settings control the primary branch Federalist uses to build your site.
              <br />
              After your DNS is pointed to Federalist, set the <a href="https://federalist-docs.18f.gov/pages/how-federalist-works/custom-urls/" target="_blank" rel="noopener noreferrer">live URL</a> to ensure the site builds correctly.
            </p>
            <label htmlFor="defaultBranchInput">
              Branch name:
            </label>
            <Field
              component="input"
              type="text"
              id="defaultBranchInput"
              name="defaultBranch"
              className="form-control"
            />
            <HttpsUrlField
              label="Live URL:"
              name="domain"
              id="domainInput"
              placeholder="https://example.gov"
              className="form-control"
            />
          </div>
        </div>
      </div>
    </div>

    <div className="usa-grid">
      <div className="usa-width-one-whole">
        <div className="form-group">
          <div className="well">
            <h3 className="well-heading">Demo Site</h3>
            <p className="well-text">
              Set a branch to be deployed to a custom demo URL like demo.yoursite.gov
              instead of to a standard Federalist preview URL.
            </p>
            <label htmlFor="demoBranchInput">Branch name:</label>
            <Field
              component="input"
              name="demoBranch"
              id="demoBranchInput"
              className="form-control"
              type="text"
              placeholder="Branch name"
            />
            <HttpsUrlField
              label="Demo URL:"
              name="demoDomain"
              id="demoDomainInput"
              placeholder="https://preview.example.gov"
              className="form-control"
            />
          </div>
        </div>
      </div>
    </div>

    <div className="usa-grid">
      <div className="usa-width-one-whole">
        <button
          type="button"
          className="usa-button usa-button-gray button-reset"
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
          Save Basic Settings
        </button>
      </div>
    </div>
  </form>
);

BasicSiteSettings.propTypes = propTypes;

// create a higher-order component with reduxForm and export that
export default reduxForm({ form: 'basicSiteSettings' })(BasicSiteSettings);
