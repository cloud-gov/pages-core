import React from 'react';
import AlertBanner from '../alertBanner';
import SiteListItem from './siteListItem';
import LinkButton from '../linkButton';

const propTypes = {
  storeState: React.PropTypes.object
};

const getSites = (sites) => {
  if (!sites.length) {
    return (
      <div className="usa-grid">
        <h1>No sites yet.</h1>
        <p>Add one now.</p>
      </div>
    );
  }

  return (
    <div className="usa-grid">
      <h2>Websites</h2>
      <ul className="sites-list">
        {sites.map((site, index) => {
            return <SiteListItem key={ index } site={ site } />
        })}
      </ul>
    </div>
  );
}

const SiteList = ({ storeState }) =>
  <div>
    <div className="usa-grid dashboard header">
      <div className="usa-width-two-thirds">
        <img className="header-icon" src="/images/websites.svg" alt="Websites icon" />
        <div className="header-title">
          <h1>Your Websites</h1>
          <p>Dashboard</p>
        </div>
      </div>
      <div className="usa-width-one-third">
        <LinkButton
          className="usa-button-big pull-right icon icon-new icon-white"
          href={'/sites/new'}
          alt="Add a new website"
          text="Add Website" />
      </div>
    </div>
    <AlertBanner {...storeState.alert} />
    { getSites(storeState.sites) }
    <div className="usa-grid">
      <div className="usa-width-one-whole">
        <LinkButton
          className="usa-button-big pull-right icon icon-new icon-white"
          href={'/sites/new'}
          alt="Add a new website"
          text="Add Website" />
      </div>
    </div>
  </div>

SiteList.propTypes = propTypes;

export default SiteList;
