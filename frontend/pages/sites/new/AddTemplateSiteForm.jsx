import React from 'react';
import PropTypes from 'prop-types';
import { Field, reduxForm, formValueSelector } from 'redux-form';
import { validAddTemplateSiteForm } from '@util/validators';
import UserOrgSelect from '@shared/UserOrgSelect';
import { useSelector } from 'react-redux';

import { ORGANIZATIONS } from '@propTypes';
import globals from '@globals';
import { IconGitHub, IconGitLab } from '@shared/icons';
import { getRepoUrl, isGitHub, isGitLab } from '@util/site';

const isWorkshopIntegration = process.env.FEATURE_WORKSHOP_INTEGRATION === 'true';

const selector = formValueSelector('addTemplateSite');
const renderOwner = (p) => (
  <input id="owner" type="text" className="usa-input" {...p.input} />
);

const renderRepository = (p) => (
  <input id="repository" type="text" className="usa-input" {...p.input} />
);

const getPlatformLabel = (sourceCodePlatform) => {
  if (isGitHub(sourceCodePlatform)) return 'GitHub account';
  if (isGitLab(sourceCodePlatform)) return 'GitLab namespace';
  return process.env.FEATURE_WORKSHOP_INTEGRATION === 'true'
    ? 'GitHub account or GitLab namespace'
    : 'GitHub account';
};

const getOwnerLabel = (sourceCodePlatform) =>
  `${getPlatformLabel(sourceCodePlatform)} your site belongs to`;

const getRepoTypeLabel = (sourceCodePlatform) => {
  if (isGitHub(sourceCodePlatform)) return 'GitHub repository ';
  if (isGitLab(sourceCodePlatform)) return 'GitLab project ';
  return process.env.FEATURE_WORKSHOP_INTEGRATION === 'true'
    ? 'GitHub repository or GitLab project '
    : 'GitHub repository';
};

const getRepoLabel = (sourceCodePlatform) =>
  `Name your new site and ${getRepoTypeLabel(sourceCodePlatform)} (lowercase, no spaces)`;

const renderIcon = (sourceCodePlatform, repoUrl) => {
  if (repoUrl && isGitHub(sourceCodePlatform)) return <IconGitHub />;
  if (repoUrl && isGitLab(sourceCodePlatform)) return <IconGitLab />;
  return null;
};

export const AddTemplateSiteForm = ({
  // even though initialValues is not directly used, it is used
  // by reduxForm, and we want PropType validation on it, so we'll
  // keep it here but disable the eslint rule below
  initialValues, // eslint-disable-line no-unused-vars
  pristine,
  invalid,
  submitting,
  handleSubmit,
  organizations,
}) => {
  const sourceCodePlatform = useSelector((state) =>
    selector(state, 'sourceCodePlatform'),
  );
  const owner = useSelector((state) => selector(state, 'owner'));
  const repository = useSelector((state) => selector(state, 'repository'));
  const repoUrl = getRepoUrl(sourceCodePlatform, owner, repository);

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-group margin-y-3">
        <Field
          name="repoOrganizationId"
          type="select"
          component={(p) => (
            <UserOrgSelect
              id="repoOrganizationId"
              name="repoOrganizationId"
              label="Cloud.gov Pages organization to contain this site"
              value={p.input.value}
              onChange={p.input.onChange}
              orgData={organizations.data}
              mustChooseOption
              {...p.meta}
            />
          )}
        />
        <label className="usa-label text-bold" htmlFor="engine">
          Source code provider
        </label>
        <Field name="sourceCodePlatform" component="select" className="usa-select">
          <option value="">-- Select a source code provider --</option>
          <option value={globals.SOURCE_CODE_PLATFORM_GITHUB}>GitHub</option>
          {isWorkshopIntegration && (
            <option value={globals.SOURCE_CODE_PLATFORM_WORKSHOP}>Workshop GitLab</option>
          )}
        </Field>
      </div>
      <div className="form-group margin-y-3">
        <label className="usa-label text-bold" htmlFor="owner">
          {getOwnerLabel(sourceCodePlatform)}
        </label>
        <Field name="owner" component={renderOwner} />
        <label className="usa-label text-bold" htmlFor="repository">
          {getRepoLabel(sourceCodePlatform)}
        </label>
        <Field name="repository" component={renderRepository} />
        <label className="usa-label text-bold" htmlFor="repository">
          New site will be created at
        </label>
        <div className="usa-input-group">
          <div className="usa-input-prefix" aria-hidden="true">
            {renderIcon(sourceCodePlatform, repoUrl)}
          </div>
          <input
            className="usa-input"
            id="repoUrl"
            name="repoUrl"
            type="text"
            value={repoUrl}
            disabled
          />
        </div>
      </div>
      <button
        type="submit"
        className="usa-button usa-button--primary inline-block"
        disabled={pristine || invalid || submitting}
      >
        Create new site from template
      </button>
    </form>
  );
};

AddTemplateSiteForm.propTypes = {
  organizations: ORGANIZATIONS.isRequired,
  initialValues: PropTypes.shape({}).isRequired,
  handleSubmit: PropTypes.func.isRequired,
  pristine: PropTypes.bool.isRequired,
  invalid: PropTypes.bool.isRequired,
  submitting: PropTypes.bool.isRequired,
};

AddTemplateSiteForm.defaultProps = {};

export default reduxForm({
  form: 'addTemplateSite',
  validate: validAddTemplateSiteForm,
})(AddTemplateSiteForm);
