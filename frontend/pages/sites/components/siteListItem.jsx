import React from 'react';
import PropTypes from 'prop-types';
import { Link, useNavigate } from 'react-router-dom';

import GitHubLink from '@shared/GitHubLink';
import ButtonLink from '@shared/ButtonLink';
import siteActions from '@actions/siteActions';
import { sandboxMsg } from '@util';

import PublishedState from './publishedState';
import RepoLastVerified from './repoLastVerified';
import { ORGANIZATION, USER } from '../../../propTypes';

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
    <li className="usa-card tablet-lg:grid-col-6">
      <div className="usa-card__container bg-base-lightest">
        <div className="usa-card__header">
          <h2 className="usa-card__heading text-normal">
            {(!site.isActive || (organization && !organization.isActive))
              ? `${getSiteName(site)} (Inactive)`
              : (
                <Link to={`/sites/${site.id}`} title="View site settings">
                  {getSiteName(site)}
                </Link>
              )}
            {' '}
          </h2>
        </div>
        <div className="usa-card__body">
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
        <div className="usa-card__footer usa-button-group">
          <div className="usa-button-group__item">
            <GitHubLink text="View repo" owner={site.owner} repository={site.repository} isButton />
          </div>
          {
            !organization
            && (
            <div className="usa-button-group__item">
              <ButtonLink className="usa-button--secondary" clickHandler={handleRemoveSite(site, user, navigate)}>Remove</ButtonLink>
            </div>
            )
          }
        </div>
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
