import React from 'react';
import PropTypes from 'prop-types';
import { Field, reduxForm } from 'redux-form';

import BranchField from '../Fields/BranchField';
import GitHubRepoUrlField from '../Fields/GitHubRepoUrlField';
import SelectSiteEngine from '../SelectSiteEngine';
import AlertBanner from '../alertBanner';

const showNewSiteAlert = () => {
  const message = (
    <span>
      Looks like this site is completely new to Federalist!
      <br />
      Please fill out these additional fields to complete the process.
    </span>
  );

  return <AlertBanner status="info" header="New Site" message={message} />;
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
    <div className="form-group">
      <GitHubRepoUrlField
        label="Already have a GitHub repo for your site? Paste the URL here."
        name="repoUrl"
        id="repoUrl"
        placeholder="https://github.com/owner/repository"
        className="form-control"
        readOnly={showAddNewSiteFields}
      />
    </div>
    {
      showAddNewSiteFields && (
      <div className="add-repo-site-additional-fields">
        {showNewSiteAlert()}
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
          <BranchField
            label="Set the primary branch Federalist will use to build your site"
            type="text"
            id="defaultBranch"
            className="form-control"
            placeholder="master"
            name="defaultBranch"
            required
          />
        </div>
      </div>
    )}
    <button
      type="submit"
      className="usa-button usa-button-primary"
      style={{ display: 'inline-block' }}
      disabled={pristine}
    >
      Add repository-based site
    </button>
  </form>
);

AddRepoSiteForm.propTypes = {
  showAddNewSiteFields: PropTypes.bool,

  initialValues: PropTypes.shape({
    engine: PropTypes.string.isRequired,
    defaultBranch: PropTypes.string.isRequired,
  }).isRequired,
  // the following props are from reduxForm:
  handleSubmit: PropTypes.func.isRequired,
  pristine: PropTypes.bool.isRequired,
};

AddRepoSiteForm.defaultProps = {
  showAddNewSiteFields: false,
};

// create a higher-order component with reduxForm and export that
export default reduxForm({ form: 'addRepoSite' })(AddRepoSiteForm);
