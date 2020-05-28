import React from 'react';
import PropTypes from 'prop-types';
import { Link } from '@reach/router';

import { IconView } from '../icons';
import PublishedState from './publishedState';
import RepoLastVerified from './repoLastVerified';
import GitHubLink from '../GitHubLink';
import ButtonLink from '../ButtonLink';
import siteActions from '../../actions/siteActions';
import { USER } from '../../propTypes';

function getViewLink(viewLink, repo) {
  return (
    <a
      href={viewLink}
      alt={`View the ${repo} site`}
      target="_blank"
      rel="noopener noreferrer"
      className="view-site-link"
    >
      View site
      {' '}
      <IconView />
    </a>
  );
}

const handleRemoveSite = (site, user) => (event) => {
  event.preventDefault();
  siteActions.removeUserFromSite(site.id, user.id)
    .then(() => siteActions.fetchSites());
};

const SiteListItem = ({ site, user }) => (
  <li className="sites-list-item">
    <div className="sites-list-item-text">
      <h4 className="site-list-item-title">
        <Link to={`/sites/${site.id}`} title="View site settings">
          {`${site.owner}/${site.repository}`}
        </Link>
        {' '}
      </h4>
      <RepoLastVerified site={site} userUpdated={user.updatedAt} />
      <PublishedState site={site} />
    </div>
    <div className="sites-list-item-actions">
      <GitHubLink text="View repo" owner={site.owner} repository={site.repository} />
      { getViewLink(site.viewLink, site.repository) }
      <ButtonLink clickHandler={handleRemoveSite(site, user)}>Remove</ButtonLink>
    </div>
  </li>
);

SiteListItem.propTypes = {
  site: PropTypes.shape({
    repository: PropTypes.string,
    owner: PropTypes.string,
    id: PropTypes.number,
    publishedAt: PropTypes.string,
    repoLastVerified: PropTypes.string,
    createdAt: PropTypes.string,
    viewLink: PropTypes.string,
  }).isRequired,
  user: USER.isRequired,
};

export default SiteListItem;
