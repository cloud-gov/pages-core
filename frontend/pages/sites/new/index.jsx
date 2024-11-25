import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import AlertBanner from '@shared/alertBanner';
import LoadingIndicator from '@shared/LoadingIndicator';
import siteActions from '@actions/siteActions';
import addNewSiteFieldsActions from '@actions/addNewSiteFieldsActions';
import { hasOrgs } from '@selectors/organization';
import globals from '@globals';

import TemplateSiteList from './TemplateSiteList';
import AddRepoSiteForm from './AddRepoSiteForm';

function getOwnerAndRepo(repoUrl) {
  const owner = repoUrl.split('/')[3];
  const repository = repoUrl.split('/')[4];

  return {
    owner,
    repository,
  };
}

function defaultOwner(user) {
  return (user.data && user.data.username) || '';
}

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
    const { owner, repository } = getOwnerAndRepo(repoUrl);
    siteActions.addSite(
      {
        owner,
        repository,
        engine,
        organizationId: repoOrganizationId,
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
            <h1 className="font-sans-2xl">Make a new site</h1>
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
          <h1 className="font-sans-2xl">Make a new site</h1>
        </div>
      </div>
      <div className="usa-prose grid-col-12">
        <p className="usa-intro margin-0">
          There are two different ways you can add sites to
          {` ${globals.APP_NAME}. `}
          You can specify the GitHub repository where your site&#39;s code lives. Or, you
          can start with a brand new site by selecting one of our template sites below.
        </p>
        <h2>Use your own GitHub repository</h2>
      </div>
      <div className="grid-col-8">
        <AddRepoSiteForm
          initialValues={{
            engine: 'jekyll',
          }}
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
    </div>
  );
}

export { AddSite };
export default AddSite;
