import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router';

import PublishedState from './publishedState';
import GitHubMark from '../GitHubMark';

const propTypes = {
  site: PropTypes.shape({
    repository: PropTypes.string,
    owner: PropTypes.string,
    id: PropTypes.number,
    publishedAt: PropTypes.string,
    viewLink: PropTypes.string,
  }),
};

function getViewLink(viewLink, repo) {
  return (
    <a
      className="icon icon-view"
      href={viewLink}
      alt={`View the ${repo} site`}
      target="_blank"
      rel="noopener noreferrer"
    >
      Visit Site
    </a>);
}

const SiteListItem = ({ site }) =>
  (<li className="sites-list-item">
    <div className="sites-list-item-text">
      <h3>
        <Link to={`/sites/${site.id}`} title="View site settings">
          { site.owner }/{ site.repository }
        </Link>

        <a className="repo-link" href={`https://github.com/${site.owner}/${site.repository}`} title="Visit repository" target="_blank" rel="noopener noreferrer">
          <GitHubMark />
        </a>
      </h3>

      <PublishedState site={site} />
    </div>
    <div className="sites-list-item-actions">
      { getViewLink(site.viewLink, site.repository) }
    </div>
  </li>);

SiteListItem.propTypes = propTypes;

export default SiteListItem;
