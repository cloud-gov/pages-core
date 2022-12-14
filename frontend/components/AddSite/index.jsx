import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import {
  ALERT,
  ORGANIZATIONS,
  SITES,
  USER,
} from '../../propTypes';
import TemplateSiteList from './TemplateSiteList';
import AddRepoSiteForm from './AddRepoSiteForm';
import AlertBanner from '../alertBanner';
import LoadingIndicator from '../LoadingIndicator';
import globals from '../../globals';
import siteActions from '../../actions/siteActions';
import addNewSiteFieldsActions from '../../actions/addNewSiteFieldsActions';
import { hasOrgs } from '../../selectors/organization';
import { useNavigate } from 'react-router-dom';

function getOwnerAndRepo(repoUrl) {
  const owner = repoUrl.split('/')[3];
  const repository = repoUrl.split('/')[4];

  return { owner, repository };
}

export function AddSite(props) {
  useEffect(() => {
    return () => {
      // Fired on component unmount.
      addNewSiteFieldsActions.hideAddNewSiteFields();
      }
  }, []);

  const { organizations, showAddNewSiteFields, sites: { isLoading }, alert, user } = props;
  const navigate = useNavigate();

  function onCreateSiteSubmit({ repoUrl, engine, repoOrganizationId }) {
    const { owner, repository } = getOwnerAndRepo(repoUrl);
    const organizationId = hasOrgs(organizations) ? repoOrganizationId : null;
    siteActions.addSite({
      owner, repository, engine, organizationId,
    });
  }

  function onAddUserSubmit({ repoUrl }) {
    const { owner, repository } = getOwnerAndRepo(repoUrl);
    siteActions.addUserToSite({ owner, repository }, () => navigate('/sites'));
  }

  function onSubmitTemplate(site) {
    siteActions.addSite(site);
  }

  // select the function to use on form submit based on
  // the showAddNewSiteFields flag
  const formSubmitFunc = showAddNewSiteFields
    ? onCreateSiteSubmit
    : onAddUserSubmit;

  const defaultOwner = (user.data && user.data.username) || '';

  if (isLoading) {
    return (
      <LoadingIndicator text="Creating your new site. Please wait..." />
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
          handleSubmitTemplate={onSubmitTemplate}
          defaultOwner={defaultOwner}
          organizations={organizations}
        />
      </div>
    </div>
  );
}

AddSite.propTypes = {
  alert: ALERT,
  organizations: ORGANIZATIONS.isRequired,
  showAddNewSiteFields: PropTypes.bool,
  sites: SITES.isRequired,
  user: USER,
};

AddSite.defaultProps = {
  alert: null,
  showAddNewSiteFields: false,
  user: null,
};

const mapStateToProps = ({
  alert, organizations, showAddNewSiteFields, sites, user,
}) => ({
  alert,
  organizations,
  showAddNewSiteFields,
  sites,
  user,
});

export default connect(mapStateToProps)(AddSite);
