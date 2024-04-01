import React from 'react';
import PropTypes from 'prop-types';
import { Link, useNavigate } from 'react-router-dom';

import PublishedState from './publishedState';
import RepoLastVerified from './repoLastVerified';
import GitHubLink from '../GitHubLink';
import ButtonLink from '../ButtonLink';
import siteActions from '../../actions/siteActions';
import { ORGANIZATION, USER } from '../../propTypes';
import { sandboxMsg } from '../../util';

function getSiteName(site) {
  return `${site.owner}/${site.repository}`;
}

const handleRemoveSite = (site, user, navigate) => (event) => {
  event.preventDefault();
  siteActions.removeUserFromSite(site.id, user.id)
    .then(() => siteActions.fetchSites())
    .then(() => navigate('/sites'));
};

function SiteListItem({ organization, site, user }) {
  const navigate = useNavigate();
  return (
    <li className="sites-list-item">
      <div className="sites-list-item-text">
        <h2 className="site-list-item-title">
          {(!site.isActive || (organization && !organization.isActive))
            ? `${getSiteName(site)} (Inactive)`
            : (
              <Link to={`/sites/${site.id}`} title="View site settings">
                {getSiteName(site)}
              </Link>
            )}
          {' '}
        </h2>
        {
          organization && (
            <h3>
              {`organization - ${organization.name}`}
            </h3>
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
        {
          !organization
          && <ButtonLink clickHandler={handleRemoveSite(site, user, navigate)}>Remove</ButtonLink>
        }
      </div>
    </li>
  );
}

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
