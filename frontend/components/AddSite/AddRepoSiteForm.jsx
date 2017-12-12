import React from 'react';
import PropTypes from 'prop-types';
import { Field, reduxForm } from 'redux-form';
import { Link } from 'react-router';

import GitHubRepoUrlField from '../GitHubRepoUrlField';
import SelectSiteEngine from '../SelectSiteEngine';

const propTypes = {
  showAddNewSiteFields: PropTypes.bool,

  initialValues: PropTypes.shape({
    engine: PropTypes.string.isRequired,
    repoUrl: PropTypes.string.isRequired
  }).isRequired,
  // the following props are from reduxForm:
  handleSubmit: PropTypes.func.isRequired,
  pristine: PropTypes.bool.isRequired,
};

const defaultProps = {
  showAddNewSiteFields: false,
};

export const AddRepoSiteForm = ({
  // even though initialValues is not directly used, it is used
  // by reduxForm, and we want PropType validation on it, so we'll
  // keep it here but disable the eslint rule below
  initialValues, // eslint-disable-line no-unused-vars
  pristine,
  handleSubmit,
  showAddNewSiteFields,
}) => (
  <form onSubmit={handleSubmit}>
    <div className="usa-grid">
      <div className="usa-width-one-half">
        <div className="form-group">
          <GitHubRepoUrlField
            name="repoUrl"
            id="repoUrl"
            className="form-control"
            readOnly={showAddNewSiteFields}
          />
        </div>
        {
          showAddNewSiteFields && (
          <div className="add-repo-site-additional-fields">
            <div className="usa-alert usa-alert-info" role="alert">
              <div className="usa-alert-body">
                <h3 className="usa-alert-heading">New Site</h3>
                <p className="usa-alert-text">
                  Looks like this site is completely new to Federalist!
                  <br />
                  Please fill out these additional fields to complete the process.
                </p>
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="engine">Static site engine</label>
              <Field
                name="engine"
                id="engine"
                component={p =>
                  <SelectSiteEngine
                    value={p.input.value}
                    onChange={p.input.onChange}
                    className="form-control"
                  />
                }
              />
            </div>
            <div className="form-group">
              <label htmlFor="defaultBranch">Primary branch</label>
              <Field
                component="input"
                type="text"
                id="defaultBranch"
                className="form-control"
                name="defaultBranch"
                required
              />
            </div>
          </div>
        )}
      </div>
    </div>
    <div className="usa-grid">
      <div className="usa-width-one-whole">
        <Link
          role="button"
          to="/sites"
          className="usa-button usa-button-secondary"
        >
          Cancel
        </Link>
        <button
          type="submit"
          className="usa-button usa-button-primary"
          style={{ display: 'inline-block' }}
          disabled={pristine}
        >
          Submit repository-based site
        </button>
      </div>
    </div>
  </form>
);

AddRepoSiteForm.propTypes = propTypes;
AddRepoSiteForm.defaultProps = defaultProps;

// create a higher-order component with reduxForm and export that
export default reduxForm({ form: 'addRepoSite' })(AddRepoSiteForm);
