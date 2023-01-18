import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import TemplateSiteList from './TemplateSiteList';
import AddRepoSiteForm from './AddRepoSiteForm';
import AlertBanner from '../alertBanner';
import LoadingIndicator from '../LoadingIndicator';
import globals from '../../globals';
import siteActions from '../../actions/siteActions';
import addNewSiteFieldsActions from '../../actions/addNewSiteFieldsActions';
import { hasOrgs } from '../../selectors/organization';

function getOwnerAndRepo(repoUrl) {
  const owner = repoUrl.split('/')[3];
  const repository = repoUrl.split('/')[4];

  return { owner, repository };
}

function defaultOwner(user) {
  return (user.data && user.data.username) || '';
}

function AddSite() {
  useEffect(() => () => {
    // dispatch the action to hide the additional new site fields
    // when this component is unmounted
    addNewSiteFieldsActions.hideAddNewSiteFields();
  }, []);

  const alert = useSelector(state => state.alert);
  const organizations = useSelector(state => state.organizations);
  const showAddNewSiteFields = useSelector(state => state.showAddNewSiteFields);
  const { isLoading } = useSelector(state => state.sites);
  const user = useSelector(state => state.user);

  const navigate = useNavigate();

  function onAddUserSubmit({ repoUrl }) {
    const { owner, repository } = getOwnerAndRepo(repoUrl);
    siteActions.addUserToSite({ owner, repository })
      .then(() => navigate('sites'));
  }

  function onCreateSiteSubmit({ repoUrl, engine, repoOrganizationId }) {
    const { owner, repository } = getOwnerAndRepo(repoUrl);
    siteActions.addSite({
      owner, repository, engine, organizationId: repoOrganizationId,
    }, navigate);
  }

  // select the function to use on form submit based on
  // the showAddNewSiteFields flag
  const formSubmitFunc = showAddNewSiteFields
    ? onCreateSiteSubmit
    : onAddUserSubmit;

  if (isLoading) {
    return (
      <LoadingIndicator text="Creating your new site. Please wait..." />
    );
  }

  if (!hasOrgs(organizations)) {
    return (
      <div className="usa-grid">
        <div className="page-header usa-grid-full">
          {/* eslint-disable-next-line react/jsx-props-no-spreading */}
          <AlertBanner {...alert} />
          <div className="header-title">
            <h1>
              Make a new site
            </h1>
            <AlertBanner
              status="warning"
              message="New site creation has been deprecated for users without an organization"
              alertRole={false}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="usa-grid">
        <div className="page-header usa-grid-full">
          {/* eslint-disable-next-line react/jsx-props-no-spreading */}
          <AlertBanner {...alert} />
          <div className="header-title">
            <h1>
              Make a new site
            </h1>
          </div>
        </div>
        <div className="usa-content">
          <p>
            There are two different ways you can add sites to
            {` ${globals.APP_NAME}. `}
            You can specify the GitHub repository where your site&#39;s code lives.
            Or, you can start with a brand new site by selecting one of our template sites below.
          </p>
        </div>
        <h2>Use your own GitHub repository</h2>
        <AddRepoSiteForm
          initialValues={{ engine: 'jekyll' }}
          organizations={organizations}
          showAddNewSiteFields={showAddNewSiteFields}
          onSubmit={formSubmitFunc}
        />
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
