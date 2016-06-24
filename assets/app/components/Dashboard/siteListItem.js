import React from 'react';
import { Link } from 'react-router';

class SiteListItem extends React.Component {
  constructor(props) {
    super(props);
  }

  getLastBuildTime(builds = []) {
    let sorted = builds.sort((a, b) => {
      let aCompletedAt = new Date(a.completedAt);
      let bCompletedAt = new Date(b.completedAt);
      return aCompletedAt > bCompletedAt;
    });
    let last = sorted.pop();

    return last.completedAt || 'forever ago';
  }

  getSiteUrl(siteId) {
    return `/sites/${siteId}`;
  }

  getViewLink(site) {
    return `#/`;
  }

  render () {
    let { site } = this.props;
    let viewLink;

    let lastPublished = <p>This site has not been published yet. Please wait while the site is built.</p>;

    if (site.builds.length) {
      lastPublished = <p>This site was last published at { this.getLastBuildTime(site.builds) }</p>
      viewLink = <a className="icon icon-view" href={ this.getViewLink(site) } alt="View the { site.repository } site" target="_blank">Visit Site</a>;
    }

    return (
      <li className="sites-list-item">
        <div className="sites-list-item-text">
          <Link to={this.getSiteUrl(site.id)}>
            { site.owner } / { site.repository }
          </Link>
          { lastPublished }
        </div>
        <div className="sites-list-item-actions">
          { viewLink }
        </div>
      </li>
    );
  }
}

SiteListItem.propTypes = {
  site: React.PropTypes.object
};

export default SiteListItem;
