import React from 'react';
import PropTypes from 'prop-types';
import { Link } from '@reach/router';
import { connect } from 'react-redux';

import { SITE, ALERT, USER } from '../../propTypes';
import AlertBanner from '../alertBanner';
import SiteListItem from './siteListItem';
import LoadingIndicator from '../LoadingIndicator';
import { IconPlus } from '../icons';

const getSites = (sites, user) => {
  const { isLoading, data } = sites;

  if (isLoading) {
    return <LoadingIndicator />;
  }

  if (!data || !data.length) {
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
        data
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

export const SiteList = ({ sites, user, alert }) => (
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
    {getSites(sites, user)}
    <a href="#top" className="back-to-top">Return to top</a>
  </div>
);

SiteList.propTypes = {
  alert: ALERT,
  sites: PropTypes.shape({
    data: PropTypes.arrayOf(SITE),
    isLoading: PropTypes.bool,
  }),
  user: USER.isRequired,
};

SiteList.defaultProps = {
  alert: null,
  sites: null,
};

const mapStateToProps = ({ alert, sites, user }) => ({
  alert,
  sites,
  user: user.data,
});

export default connect(mapStateToProps)(SiteList);
