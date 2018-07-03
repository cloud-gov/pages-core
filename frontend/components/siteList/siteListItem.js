import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router';

import { IconView } from '../icons';
import PublishedState from './publishedState';
import GitHubLink from '../GitHubLink';

function getViewLink(viewLink, repo) {
  return (
    <a
      href={viewLink}
      alt={`View the ${repo} site`}
      target="_blank"
      rel="noopener noreferrer"
      className="view-site-link"
    >
      View site <IconView />
    </a>);
}

const SiteListItem = ({ site }) =>
  (<li className="sites-list-item">
    <div className="sites-list-item-text">
      <h4 className="site-list-item-title">
        <Link to={`/sites/${site.id}`} title="View site settings">
          { site.owner }/{ site.repository }
        </Link>
        {' '}
      </h4>
      <PublishedState site={site} />
    </div>
    <div className="sites-list-item-actions">
      <GitHubLink text="View repo" owner={site.owner} repository={site.repository} />
      { getViewLink(site.viewLink, site.repository) }
    </div>
  </li>);

SiteListItem.propTypes = {
  site: PropTypes.shape({
    repository: PropTypes.string,
    owner: PropTypes.string,
    id: PropTypes.number,
    publishedAt: PropTypes.string,
    viewLink: PropTypes.string,
  }),
};

export default SiteListItem;
