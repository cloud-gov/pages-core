import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import AlertBanner from '@shared/alertBanner';
import LoadingIndicator from '@shared/LoadingIndicator';
import siteActions from '@actions/siteActions';
import addNewSiteFieldsActions from '@actions/addNewSiteFieldsActions';
import { hasOrgs } from '@selectors/organization';
import globals from '@globals';
import { getOwnerAndRepo, isWorkshopIntegration } from '@util/site';

import TemplateSiteList from './TemplateSiteList';
import AddRepoSiteForm from './AddRepoSiteForm';
import AddTemplateSiteForm from '@pages/sites/new/AddTemplateSiteForm';

function defaultOwner(user) {
  return (user.data && user.data.username) || '';
}

const orGitLabProject = ` ${isWorkshopIntegration ? ' or GitLab project ' : ' '}`;

function AddSite() {
  useEffect(
    () => () => {
      // dispatch the action to hide the additional new site fields
      // when this component is unmounted
      addNewSiteFieldsActions.hideAddNewSiteFields();
    },
    [],
  );

  const alert = useSelector((state) => state.alert);
  const organizations = useSelector((state) => state.organizations);
  const showAddNewSiteFields = useSelector((state) => state.showAddNewSiteFields);
  const { isLoading } = useSelector((state) => state.sites);
  const user = useSelector((state) => state.user);

  const navigate = useNavigate();

  function onCreateSiteSubmit({ repoUrl, engine, repoOrganizationId }) {
    const { owner, repository, sourceCodePlatform, sourceCodeUrl } =
      getOwnerAndRepo(repoUrl);
    siteActions.addSite(
      {
        owner,
        repository,
        engine,
        organizationId: repoOrganizationId,
        sourceCodePlatform,
        sourceCodeUrl,
      },
      navigate,
    );
  }

  if (isLoading) {
    return <LoadingIndicator text="Creating your new site. Please wait..." />;
  }

  if (!hasOrgs(organizations)) {
    const alertMessage =
      'New site creation has been deprecated for users without an organization';

    return (
      <div className="grid-row">
        <div className="page-header grid-col-12">
          <AlertBanner {...alert} />
          <div className="header-title">
            <h1 className="font-sans-2xl">Add a new site</h1>
            <AlertBanner status="warning" message={alertMessage} alertRole={false} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid-row">
      <div className="page-header grid-col-12">
        <AlertBanner {...alert} />
        <div className="header-title">
          <h1 className="font-sans-2xl">Add a new site</h1>
        </div>
      </div>
      <div className="usa-prose grid-col-12">
        <p className="usa-intro margin-0">
          Set up a new site using {`${globals.APP_NAME}`} ready-made, USWDS-powered site template.
          If you already have GitHub repository ${orGitLabProject} for your new site, add details below.
        </p>
      </div>
      <div className="grid-col-8">
        <AddTemplateSiteForm
          organizations={organizations}
          showAddNewSiteFields={showAddNewSiteFields}
          onSubmit={onCreateSiteSubmit}
        />
      </div>
      <div className="grid-col-12">
        <TemplateSiteList
          defaultOwner={defaultOwner(user)}
          organizations={organizations}
        />
      </div>
      <div className="grid-col-8">
        <h2>Use an existing GitHub repository {orGitLabProject}</h2>
        <AddRepoSiteForm
          initialValues={{
            engine: 'node.js',
          }}
          organizations={organizations}
          showAddNewSiteFields={showAddNewSiteFields}
          onSubmit={onCreateSiteSubmit}
        />
      </div>
    </div>
  );
}

export { AddSite };
export default AddSite;
