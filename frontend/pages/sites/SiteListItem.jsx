import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

import GitHubLink from '@shared/GitHubLink';
import { sandboxMsg } from '@util';
import { ORGANIZATION } from '@propTypes';

import PublishedState from './PublishedState';

function getSiteName(site) {
  return `${site.owner}/${site.repository}`;
}

function SiteListItem({ organization, site }) {
  return (
    <li className="usa-card tablet-lg:grid-col-6">
      <div className="usa-card__container bg-base-lightest">
        <div className="usa-card__header">
          <h2 className="usa-card__heading text-normal">
            {!site.isActive || !organization.isActive ? (
              `${getSiteName(site)} (Inactive)`
            ) : (
              <Link to={`/sites/${site.id}/builds`} title="View site builds">
                {getSiteName(site)}
              </Link>
            )}{' '}
          </h2>
        </div>
        <div className="usa-card__body">
          <h3>{`organization - ${organization.name}`}</h3>
          {organization.isSandbox && (
            <p>
              <em>{sandboxMsg(organization.daysUntilSandboxCleaning, 'site')}</em>
            </p>
          )}
          <PublishedState site={site} />
        </div>
        <div className="usa-card__footer usa-button-group">
          <div className="usa-button-group__item">
            <GitHubLink
              text="View repo"
              owner={site.owner}
              repository={site.repository}
              isButton
            />
          </div>
        </div>
      </div>
    </li>
  );
}

SiteListItem.propTypes = {
  organization: ORGANIZATION.isRequired,
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
};

export default SiteListItem;
