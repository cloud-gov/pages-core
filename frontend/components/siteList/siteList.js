import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router';
import { connect } from 'react-redux';

import { SITE, ALERT } from '../../propTypes';
import AlertBanner from '../alertBanner';
import SiteListItem from './siteListItem';
import LoadingIndicator from '../LoadingIndicator';
import { IconPlus } from '../icons';

const getSites = (sites) => {
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
          .map(site => <SiteListItem key={site.id} site={site} />)
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
    <IconPlus /> Add site
  </Link>
);

export const SiteList = ({ sites, alert }) =>
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
    {getSites(sites)}
    <a href="#top">Return to top</a>
  </div>;

SiteList.propTypes = {
  alert: ALERT,
  sites: PropTypes.shape({
    data: PropTypes.arrayOf(SITE),
    isLoading: PropTypes.bool,
  }),
};

SiteList.defaultProps = {
  alert: null,
  sites: null,
};

const mapStateToProps = ({ alert, sites }) => ({
  alert,
  sites,
});

export default connect(mapStateToProps)(SiteList);

