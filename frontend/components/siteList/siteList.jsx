import React from 'react';
import PropTypes from 'prop-types';
import { Link } from '@reach/router';
import { connect } from 'react-redux';

import {
  SITE, ALERT, USER, ORGANIZATION,
} from '../../propTypes';
import { groupSitesByOrg } from '../../selectors/site';
import AlertBanner from '../alertBanner';
import SiteListItem from './siteListItem';
import LoadingIndicator from '../LoadingIndicator';
import { IconPlus } from '../icons';

const getSites = (sites, user) => {
  if (!sites || !sites.length) {
    return (
      <div className="usa-grid">
        <h1>No sites yet.</h1>
        <p>Add one now.</p>
      </div>
    );
  }

  return (
    <ul className="sites-list usa-unstyled-list">
      {
        sites
          .slice() // create a copy so that sort doesn't modify the original
          .sort((a, b) => a.id - b.id) // sort by id ascending
          .map(site => <SiteListItem key={site.id} site={site} user={user} />)
      }
    </ul>
  );
};

const addWebsiteButton = () => (
  <Link
    to="/sites/new"
    role="button"
    className="usa-button button-add-website"
    alt="Add a new site"
  >
    <IconPlus />
    {' '}
    Add site
  </Link>
);

const getOrganizations = (organizations, sites, users) => {
  const { isLoading: orgsLoading, data: orgData } = organizations;
  const { isLoading: sitesLoading, data: siteData } = sites;

  if (orgsLoading || sitesLoading) {
    return <LoadingIndicator />;
  }

  if (!orgData || orgData.length === 0) return getSites(siteData, users);

  const groupedSitesByOrg = groupSitesByOrg(sites, organizations);

  return Object.keys(groupedSitesByOrg).map((group) => {
    const isOrg = group !== 'unassociated';
    const orgTitle = isOrg ? (
      <h3>
        <span style={{ fontWeight: 'normal' }}>Organization:</span>
        <span
          style={{
            paddingLeft: '1rem',
            textTransform: 'uppercase',
          }}
        >
          {group}
        </span>
      </h3>
    ) : null;

    return (
      <div
        className={isOrg ? 'well' : ''}
        key={`org-${group}`}
      >
        {orgTitle}
        {getSites(groupedSitesByOrg[group], users)}
      </div>
    );
  });
};

export const SiteList = ({
  organizations, sites, user, alert,
}) => (
  <div>
    <div className="page-header usa-grid-full">
      <div className="usa-width-two-thirds">
        <h1>
          Your sites
        </h1>
      </div>
      <div className="usa-width-one-third header-actions">
        {addWebsiteButton()}
      </div>
    </div>

    <AlertBanner {...alert} />
    {getOrganizations(organizations, sites, user)}
    <a href="#top" className="back-to-top">Return to top</a>
  </div>
);

SiteList.propTypes = {
  alert: ALERT,
  organizations: PropTypes.shape({
    data: PropTypes.arrayOf(ORGANIZATION),
    isLoading: PropTypes.bool,
  }),
  sites: PropTypes.shape({
    data: PropTypes.arrayOf(SITE),
    isLoading: PropTypes.bool,
  }),
  user: USER.isRequired,
};

SiteList.defaultProps = {
  alert: null,
  organizations: null,
  sites: null,
};

const mapStateToProps = ({
  alert, organizations, sites, user,
}) => ({
  alert,
  organizations,
  sites,
  user: user.data,
});

export default connect(mapStateToProps)(SiteList);
