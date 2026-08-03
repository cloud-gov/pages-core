import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { validAddTemplateSiteForm } from '@util/validators';
import UserOrgSelect from '@shared/UserOrgSelect';
import { ORGANIZATIONS } from '@propTypes';
import globals from '@globals';
import { IconGitHub, IconGitLab } from '@shared/icons';
import { getRepoUrl, isGitHub, isGitLab } from '@util/site';

export const AddTemplateSiteForm = ({ organizations, onSubmit }) => {
  const [values, setValues] = useState({
    repoOrganizationId: '',
    sourceCodePlatform: '',
    owner: '',
    repository: '',
  });
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { repoOrganizationId, sourceCodePlatform, owner, repository } = values;
  const errors = validAddTemplateSiteForm(values);
  const invalid = Object.keys(errors).length > 0;
  const repoUrl = getRepoUrl(sourceCodePlatform, owner, repository);

  let ownerLabel = 'GitHub account your site belongs to';
  if (isGitLab(sourceCodePlatform)) {
    ownerLabel = 'GitLab namespace your site belongs to';
  } else if (
    !isGitHub(sourceCodePlatform) &&
    process.env.FEATURE_WORKSHOP_INTEGRATION === 'true'
  ) {
    ownerLabel = 'GitHub account or GitLab namespace your site belongs to';
  }

  let repoTypeLabel = 'GitHub repository';
  if (isGitHub(sourceCodePlatform)) {
    repoTypeLabel = 'GitHub repository ';
  } else if (isGitLab(sourceCodePlatform)) {
    repoTypeLabel = 'GitLab project ';
  } else if (process.env.FEATURE_WORKSHOP_INTEGRATION === 'true') {
    repoTypeLabel = 'GitHub repository or GitLab project ';
  }

  let icon = null;
  if (repoUrl && isGitHub(sourceCodePlatform)) {
    icon = <IconGitHub />;
  } else if (repoUrl && isGitLab(sourceCodePlatform)) {
    icon = <IconGitLab />;
  }

  const isFieldInvalid = (name) => (touched[name] || submitted) && !!errors[name];

  function handleChange(event) {
    const { name, value } = event.target;
    setValues((prevValues) => ({ ...prevValues, [name]: value }));
    setTouched((prevTouched) => ({ ...prevTouched, [name]: true }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    setSubmitted(true);

    if (invalid) {
      return;
    }

    setSubmitting(true);
    onSubmit(values);
    setValues({
      repoOrganizationId: '',
      sourceCodePlatform: '',
      owner: '',
      repository: '',
    });
    setTouched({});
    setSubmitted(false);
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-group margin-y-3">
        <UserOrgSelect
          id="repoOrganizationId"
          name="repoOrganizationId"
          label="Cloud.gov Pages organization to contain this site"
          value={repoOrganizationId}
          onChange={handleChange}
          orgData={organizations.data}
          mustChooseOption
          touched={isFieldInvalid('repoOrganizationId')}
          error={errors.repoOrganizationId}
        />
        <label className="usa-label text-bold" htmlFor="sourceCodePlatform">
          Source code provider
        </label>
        {isFieldInvalid('sourceCodePlatform') && (
          <span className="usa-error-message">{errors.sourceCodePlatform}</span>
        )}
        <select
          id="sourceCodePlatform"
          name="sourceCodePlatform"
          className="usa-select"
          value={sourceCodePlatform}
          onChange={handleChange}
        >
          <option value="">-- Select a source code provider --</option>
          <option value={globals.SOURCE_CODE_PLATFORM_GITHUB}>GitHub</option>
          {process.env.FEATURE_WORKSHOP_INTEGRATION === 'true' && (
            <option value={globals.SOURCE_CODE_PLATFORM_WORKSHOP}>Workshop GitLab</option>
          )}
        </select>
      </div>
      <div className="form-group margin-y-3">
        <label className="usa-label text-bold" htmlFor="owner">
          {ownerLabel}
        </label>
        {isFieldInvalid('owner') && (
          <span className="usa-error-message">{errors.owner}</span>
        )}
        <input
          id="owner"
          name="owner"
          type="text"
          className="usa-input"
          value={owner}
          onChange={handleChange}
        />
        <label className="usa-label text-bold" htmlFor="repository">
          {`Name your new site and ${repoTypeLabel} (lowercase, no spaces)`}
        </label>
        {isFieldInvalid('repository') && (
          <span className="usa-error-message">{errors.repository}</span>
        )}
        <input
          id="repository"
          name="repository"
          type="text"
          className="usa-input"
          value={repository}
          onChange={handleChange}
        />
        <label className="usa-label text-bold" htmlFor="repoUrl">
          New site will be created at
        </label>
        <div className="usa-input-group">
          <div className="usa-input-prefix" aria-hidden="true">
            {icon}
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
        disabled={invalid || submitting}
      >
        Create new site from template
      </button>
    </form>
  );
};

AddTemplateSiteForm.propTypes = {
  organizations: ORGANIZATIONS.isRequired,
  onSubmit: PropTypes.func.isRequired,
};

export default AddTemplateSiteForm;
