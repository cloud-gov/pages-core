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
    alt="Add a new website"
  >
    <svg width="12px" height="12px" viewBox="0 0 12 12" version="1.1">
      <g id="Symbols" stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
        <g id="icon-plus-12" fill="#FFFFFF" fillRule="nonzero">
          <g id="Group">
            <path d="M5,1.27272727 C5,0.569819409 5.44771525,0 6,0 C6.55228475,0 7,0.569819409
              7,1.27272727 L7,10.7272727 C7,11.4301806 6.55228475,12 6,12 C5.44771525,12
              5,11.4301806 5,10.7272727 L5,1.27272727 Z" id="Shape"
              transform="translate(6.000000, 6.000000) scale(1, -1)
              translate(-6.000000, -6.000000) " />
            <path d="M5,1.27272727 C5,0.569819409 5.44771525,0 6,0 C6.55228475,0 7,0.569819409
              7,1.27272727 L7,10.7272727 C7,11.4301806 6.55228475,12 6,12 C5.44771525,12
              5,11.4301806 5,10.7272727 L5,1.27272727 Z" id="Shape-Copy"
              transform="translate(6.000000, 6.000000) scale(1, -1) rotate(90.000000)
              translate(-6.000000, -6.000000) " />
          </g>
        </g>
      </g>
    </svg>
    Add website
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
    {addWebsiteButton()}
  </div>);

SiteList.propTypes = propTypes;
SiteList.defaultProps = defaultProps;

export default connect(state => state)(SiteList);
