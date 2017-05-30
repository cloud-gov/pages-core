import PropTypes from 'prop-types';
import React from 'react';
import { Link } from 'react-router';
import PublishedState from './publishedState';

const propTypes = {
  site: PropTypes.shape({
    repository: PropTypes.string,
    owner: PropTypes.string,
    id: PropTypes.number,
    publishedAt: PropTypes.string,
    viewLink: PropTypes.string
  })
};

const getViewLink = (viewLink, repo) => {
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
      <PublishedState site={site} />
    </div>
    <div className="sites-list-item-actions">
      { getViewLink(site.viewLink, site.repository) }
    </div>
  </li>

SiteListItem.propTypes = propTypes;

export default SiteListItem;
