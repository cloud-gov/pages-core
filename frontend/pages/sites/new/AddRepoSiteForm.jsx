import React from 'react';
import PropTypes from 'prop-types';
import { Field, reduxForm } from 'redux-form';

import GitHubRepoUrlField from '@shared/Fields/GitHubRepoUrlField';
import { validAddRepoSiteForm } from '@util/validators';
import UserOrgSelect from '@shared/UserOrgSelect';
import SelectSiteEngine from '@shared/SelectSiteEngine';

import { ORGANIZATIONS } from '@propTypes';

export const AddRepoSiteForm = ({
  // even though initialValues is not directly used, it is used
  // by reduxForm, and we want PropType validation on it, so we'll
  // keep it here but disable the eslint rule below
  initialValues, // eslint-disable-line no-unused-vars
  pristine,
  handleSubmit,
  organizations,
  showAddNewSiteFields,
}) => (
  <form onSubmit={handleSubmit}>
    <div className="form-group margin-y-3">
      <GitHubRepoUrlField
        label="Already have a GitHub repo for your site? Paste the URL here."
        name="repoUrl"
        id="repoUrl"
        placeholder="https://github.com/owner/repository"
        readOnly={showAddNewSiteFields}
      />
    </div>
    <div className="form-group margin-y-3">
      <Field
        name="repoOrganizationId"
        type="select"
        component={(p) => (
          <UserOrgSelect
            id="repoOrganizationId"
            name="repoOrganizationId"
            value={p.input.value}
            onChange={p.input.onChange}
            orgData={organizations.data}
            mustChooseOption
            {...p.meta}
          />
        )}
      />
    </div>
    <div className="form-group margin-y-3">
      <label className="usa-label text-bold" htmlFor="engine">
        Select the site&apos;s engine
      </label>
      <Field
        name="engine"
        component={(p) => (
          <SelectSiteEngine
            name="engine"
            id="engine"
            value={p.input.value}
            onChange={p.input.onChange}
            {...p.meta}
          />
        )}
      />
    </div>
    <button
      type="submit"
      className="usa-button usa-button--primary inline-block"
      disabled={pristine}
    >
      Add repository-based site
    </button>
  </form>
);

AddRepoSiteForm.propTypes = {
  organizations: ORGANIZATIONS.isRequired,
  showAddNewSiteFields: PropTypes.bool,
  initialValues: PropTypes.shape({
    engine: PropTypes.string.isRequired,
  }).isRequired,
  // the following props are from reduxForm:
  handleSubmit: PropTypes.func.isRequired,
  pristine: PropTypes.bool.isRequired,
};

AddRepoSiteForm.defaultProps = {
  showAddNewSiteFields: false,
};

// create a higher-order component with reduxForm and export that
export default reduxForm({
  form: 'addRepoSite',
  validate: validAddRepoSiteForm,
})(AddRepoSiteForm);
