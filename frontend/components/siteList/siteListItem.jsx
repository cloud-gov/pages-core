import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

import { IconView } from '../icons';
import PublishedState from './publishedState';
import RepoLastVerified from './repoLastVerified';
import GitHubLink from '../GitHubLink';
import ButtonLink from '../ButtonLink';
import siteActions from '../../actions/siteActions';
import { ORGANIZATION, USER } from '../../propTypes';
import { sandboxMsg } from '../../util';

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

function getSiteName(site) {
  return `${site.owner}/${site.repository}`;
}

const handleRemoveSite = (site, user) => (event) => {
  event.preventDefault();
  siteActions.removeUserFromSite(site.id, user.id)
    .then(() => siteActions.fetchSites());
};

const SiteListItem = ({ organization, site, user }) => (
  <li className="sites-list-item">
    <div className="sites-list-item-text">
      <h4 className="site-list-item-title">
        {(!site.isActive || (organization && !organization.isActive))
          ? `${getSiteName(site)} (Inactive)`
          : (
            <Link to={`/sites/${site.id}`} title="View site settings">
              {getSiteName(site)}
            </Link>
          )}
        {' '}
      </h4>
      {
        organization && (
          <h5>
            {`organization - ${organization.name}`}
          </h5>
        )
      }
      <RepoLastVerified site={site} userUpdated={user.updatedAt} />
      { organization?.isSandbox
          && (
          <p>
            <em>
              {sandboxMsg(organization.daysUntilSandboxCleaning, 'site')}
            </em>
          </p>
          )}
      <PublishedState site={site} />
    </div>
    <div className="sites-list-item-actions">
      <GitHubLink text="View repo" owner={site.owner} repository={site.repository} />
      { getViewLink(site.viewLink, site.repository) }
      {
        !organization
        && <ButtonLink clickHandler={handleRemoveSite(site, user)}>Remove</ButtonLink>
      }
    </div>
  </li>
);

SiteListItem.propTypes = {
  organization: ORGANIZATION,
  site: PropTypes.shape({
    repository: PropTypes.string,
    owner: PropTypes.string,
    id: PropTypes.number,
    publishedAt: PropTypes.string,
    repoLastVerified: PropTypes.string,
    createdAt: PropTypes.string,
    viewLink: PropTypes.string,
    isActive: PropTypes.bool,
  }).isRequired,
  user: USER.isRequired,
};

SiteListItem.defaultProps = {
  organization: null,
};

export default SiteListItem;
