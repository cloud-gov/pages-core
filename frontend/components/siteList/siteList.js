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
    <svg width="14px" height="14px" viewBox="0 0 14 14" version="1.1" >
        <g id="Artboard-7" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd" transform="translate(-55.000000, -46.000000)">
            <g id="icon-plus" transform="translate(55.000000, 46.000000)" fill="#FFFFFF">
                <g id="Group">
                    <path d="M6,1.27272727 C6,0.569819409 6.44771525,0 7,0 C7.55228475,0 8,0.569819409 8,1.27272727 L8,12.7272727 C8,13.4301806 7.55228475,14 7,14 C6.44771525,14 6,13.4301806 6,12.7272727 L6,1.27272727 Z" id="Shape" fill-rule="nonzero" transform="translate(7.000000, 7.000000) scale(1, -1) translate(-7.000000, -7.000000) "></path>
                    <path d="M6,1.27272727 C6,0.569819409 6.44771525,0 7,0 C7.55228475,0 8,0.569819409 8,1.27272727 L8,12.7272727 C8,13.4301806 7.55228475,14 7,14 C6.44771525,14 6,13.4301806 6,12.7272727 L6,1.27272727 Z" id="Shape-Copy" fill-rule="nonzero" transform="translate(7.000000, 7.000000) scale(1, -1) rotate(90.000000) translate(-7.000000, -7.000000) "></path>
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
