import React from 'react';
import PropTypes from 'prop-types';
import { Field, reduxForm } from 'redux-form';

import HttpsUrlInput from '../httpsUrlInput';

const propTypes = {
  // initialValues is what the initial form values are based on
  initialValues: PropTypes.shape({
    defaultBranch: PropTypes.string.isRequired,
    domain: PropTypes.string.isRequired,
    demoBranch: PropTypes.string.isRequired,
    demoDomain: PropTypes.string.isRequired,
  }).isRequired,

  // the following props are from reduxForm:
  handleSubmit: PropTypes.func.isRequired,
  reset: PropTypes.func.isRequired,
  pristine: PropTypes.bool.isRequired,
};


// TODO: domain and demoDomain are not working with the reduxForm
// Probably because of the wrapped component

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
        <label htmlFor="defaultBranchInput" className="active">
          Default branch
        </label>
        <Field
          component="input"
          type="text"
          id="defaultBranchInput"
          name="defaultBranch"
          className="form-control"
        />
      </div>
    </div>

    <div className="usa-grid">
      <div className="usa-width-one-whole">
        <div className="form-group">
          <div className="well">
            <h3 className="well-heading">Custom Domain</h3>
            <p className="well-text">
              After you delegate your .gov or .mil URL to Federalist,
              enter the URL here so your site builds correctly.
              See <a href="https://federalist-docs.18f.gov/pages/how-federalist-works/custom-urls/" target="_blank" rel="noopener noreferrer">
              Federalist&apos;s custom URL documentation</a> for more information.
            </p>
            <Field
              name="domain"
              component={p =>
                <HttpsUrlInput
                  value={p.input.value}
                  onChange={p.input.onChange}
                  className="form-control"
                  id="domainInput"
                />
              }
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
              Setup a branch to be deployed to a demo URL.
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
            <label htmlFor="demoDomainInput">Demo domain:</label>
            <Field
              name="demoDomain"
              component={p =>
                <HttpsUrlInput
                  value={p.input.value}
                  onChange={p.input.onChange}
                  className="form-control"
                  placeholder="https://preview.example.com"
                  id="demoDomainInput"
                />
              }
            />
          </div>
        </div>
      </div>
    </div>

    <div className="usa-grid">
      <div className="usa-width-one-whole">
        <button
          type="button"
          className="usa-button usa-button-gray"
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
          Save
        </button>
      </div>
    </div>
  </form>
);

BasicSiteSettings.propTypes = propTypes;

// create a higher-order component with reduxForm and export that
export default reduxForm({ form: 'basicSiteSettings' })(BasicSiteSettings);
