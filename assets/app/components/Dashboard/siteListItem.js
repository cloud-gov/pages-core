import React from 'react';
import { Link } from 'react-router';
import PublishedState from './publishedState';

const propTypes = {
  site: React.PropTypes.object
};

const getViewLink = (viewLink) => {
  if (!viewLink) return null;

  return <a
    className="icon icon-view"
    href={ viewLink }
    alt="View the { site.repository } site"
    target="_blank">Visit Site</a>;
}

const SiteListItem = ({ site }) =>
  <li className="sites-list-item">
    <div className="sites-list-item-text">
      <Link to={`/sites/${site.id}`}>
        { site.owner } / { site.repository }
      </Link>
      <PublishedState builds={ site.builds } />
    </div>
    <div className="sites-list-item-actions">
      { getViewLink(site.builds && site.builds.length && site.viewLink) }
    </div>
  </li>

SiteListItem.propTypes = propTypes;

export default SiteListItem;
