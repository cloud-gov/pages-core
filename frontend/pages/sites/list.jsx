import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';

import { getOrgById, orgFilterOptions, hasOrgs } from '@selectors/organization';
import { groupSitesByOrg } from '@selectors/site';
import AlertBanner from '@shared/alertBanner';
import LoadingIndicator from '@shared/LoadingIndicator';
import GithubAuthButton from '@shared/GithubAuthButton';
import UsaIcon from '@shared/UsaIcon';
import UserOrgSelect from '@shared/UserOrgSelect';
import alertActions from '@actions/alertActions';
import userActions from '@actions/userActions';

import SiteListItem from './components/siteListItem';

const onGithubAuthSuccess = () => {
  userActions.fetchUser();
  alertActions.alertSuccess('Github authorization successful');
};

const onGithubAuthFailure = (error) => {
  alertActions.alertError(error.message);
};

const mapSites = (organizations, siteData, user) => (
  siteData
    .slice() // create a copy so that sort doesn't modify the original
    .sort((a, b) => a.id - b.id) // sort by id ascending
    .map((site) => {
      const { organizationId } = site;
      const organization = getOrgById(organizations, organizationId);
      return (
        <SiteListItem
          key={site.id}
          organization={organization}
          site={site}
          user={user}
        />
      );
    })
);

const getSites = (organizations, sites, user) => {
  const { isLoading, data } = sites;

  if (isLoading) {
    return <LoadingIndicator />;
  }

  if (!data || !data.length) {
    return (
      <div className="grid-row">
        <h1 className="font-sans-2xl">No sites yet.</h1>
        <p>Add one now.</p>
      </div>
    );
  }

  return (
    <ul className="usa-card-group">
      {mapSites(organizations, data, user)}
    </ul>
  );
};

export const List = () => {
  const alert = useSelector(state => state.alert);
  const organizations = useSelector(state => state.organizations);
  const sites = useSelector(state => state.sites);
  const user = useSelector(state => state.user.data);

  const [orgFilterValue, setOrgFilterValue] = useState('all-options');
  const groupedSites = groupSitesByOrg(sites, orgFilterValue);

  let topButton = '';

  if (user.hasGithubAuth && hasOrgs(organizations)) {
    topButton = (
      <Link
        to="/sites/new"
        role="button"
        className="usa-button button-add-website margin-right-0"
        alt="Add a new site"
      >
        <UsaIcon name="add" />
        {' '}
        Add site
      </Link>
    );
  } else {
    topButton = (
      <GithubAuthButton
        onSuccess={onGithubAuthSuccess}
        onFailure={onGithubAuthFailure}
        text="Sign in to your Github account to add sites to the platform."
      />
    );
  }

  return (
    <div className="grid-col-12">
      <div className="page-header grid-row flex-align-center">
        <div className="tablet:grid-col-fill grid-col-12">
          <h1 className="font-sans-2xl">
            Your sites
          </h1>
        </div>
        <div className="tablet:grid-col-auto grid-col-12 header-actions">
          {topButton}
        </div>
      </div>
      {
        hasOrgs(organizations)
          ? (
            <div className="margin-y-2 grid-row">
              <div className="tablet:grid-col-4 grid-col-12">
                <UserOrgSelect
                  id="filter-sites-by-org"
                  label="Filter sites by organization."
                  name="filter-sites-by-org"
                  orgData={orgFilterOptions(organizations)}
                  value={orgFilterValue}
                  onChange={({ target: { value } }) => setOrgFilterValue(value)}
                />
              </div>
            </div>
          ) : null
      }

      <AlertBanner {...alert} />
      <div className="grid-row margin-y-3">
        <div className="grid-col">
          {getSites(organizations, groupedSites, user)}
        </div>
      </div>
    </div>
  );
};

export default List;
