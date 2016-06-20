import React from 'react';

import SiteListItem from './siteListItem';

class SiteList extends React.Component {
  constructor(props) {
    super(props);
    console.log('props', props);
  }

  getNewSiteUrl() {
    return `#/sites/new`;
  }

  render () {
    let content = (
      <div className="usa-grid">
        <h1>No sites yet.</h1>
        <p>Add one now.</p>
      </div>
    );

    if (this.props.sites.length > 1) {
      content = (
        <div className="usa-grid">
          <h2>Websites</h2>
          <ul className="sites-list">
            { this.props.sites.map((site) => {
                return <SiteListItem key={ site.id } site={ site } />
            })}
          </ul>
        </div>
      );
    }

    return (
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
            <a className="usa-button usa-button-big pull-right icon icon-new icon-white" href={ this.getNewSiteUrl() }  alt="Add a new website" role="button">Add Website</a>
          </div>
        </div>

        { content }

        <div className="usa-grid">
          <div className="usa-width-one-whole">
            <a className="usa-button usa-button-big icon icon-new icon-white" href={ this.getNewSiteUrl() }  alt="Add a new website" role="button">Add Website</a>
          </div>
        </div>

      </div>
    );
  }
}

SiteList.propTypes = {
  sites: React.PropTypes.array
};

export default SiteList;
