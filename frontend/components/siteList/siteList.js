import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router';
import { connect } from 'react-redux';

import AlertBanner from '../alertBanner';
import SiteListItem from './siteListItem';
import LoadingIndicator from '../LoadingIndicator';

const propTypes = {
  storeState: PropTypes.shape({
    isLoading: PropTypes.bool,
    data: PropTypes.array,
  }),
};

const defaultProps = {
  storeState: null,
};

const getSites = (sitesState) => {
  if (sitesState.isLoading) {
    return <LoadingIndicator />;
  }

  if (!sitesState.data || !sitesState.data.length) {
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
        sitesState.data
          .slice() // create a copy so that sort doesn't modify the original
          .sort((a, b) => a.id - b.id) // sort ascending by id
          .map(site => (<SiteListItem key={site.id} site={site} />))
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
    Add site
  </Link>
);

export const SiteList = ({ storeState }) =>
  (<div className="usa-grid">
    <div className="page-header usa-grid-full">
      <div className="usa-width-two-thirds">
        <div className="header-title">
          <h1>
            <img className="header-icon" src="/images/websites.svg" alt="Websites icon" />
            Your websites
          </h1>
        </div>
      </div>
      <div className="usa-width-one-third header-actions">
        {addWebsiteButton()}
      </div>
    </div>

    <AlertBanner {...storeState.alert} />
    {getSites(storeState.sites)}
    <a href="#top">Return to top</a>
  </div>);

SiteList.propTypes = propTypes;
SiteList.defaultProps = defaultProps;

export default connect(state => state)(SiteList);
