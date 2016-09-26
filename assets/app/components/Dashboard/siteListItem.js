import React from 'react';
import { Link } from 'react-router';
import PublishedState from './publishedState';

const propTypes = {
  site: React.PropTypes.shape({
    repository: React.PropTypes.string,
    owner: React.PropTypes.string,
    id: React.PropTypes.number,
    builds: React.PropTypes.array,
    viewLink: React.PropTypes.string
  })
};

const getViewLink = (hasLink, viewLink, repo) => {
  if (!hasLink) return null;

  return <a
    className="icon icon-view"
    href={ viewLink }
    alt={`View the ${repo} site`}
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
      { getViewLink(!!site.builds.length, site.viewLink, site.repository) }
    </div>
  </li>

SiteListItem.propTypes = propTypes;

export default SiteListItem;
