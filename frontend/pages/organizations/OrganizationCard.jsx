import React from 'react';
import { Link } from 'react-router-dom';
import { sandboxMsg } from '@util';
import { ORGANIZATION, ROLE } from '../../propTypes';

function OrganizationCard({ organization, role }) {
  return (
    <li className="usa-card tablet-lg:grid-col-6">
      <div className="usa-card__container bg-base-lightest">
        <div className="usa-card__header">
          <h4 className="usa-card__heading text-normal">
            {organization.name}
          </h4>
        </div>
        <div className="usa-card__body">
          {organization.isSandbox && (
          <p>
            <em>{sandboxMsg(organization.daysUntilSandboxCleaningdays)}</em>
          </p>
          )}
        </div>
        <div className="usa-card__footer">
          {!organization.isActive
            ? 'Inactive'
            : role.name === 'manager' && (
            <Link
              className="usa-button usa-button--outline"
              to={`/organizations/${organization.id}`}
              title="Edit organization"
            >
              Edit
            </Link>
            )}
        </div>
      </div>
    </li>
  );
}

OrganizationCard.propTypes = {
  organization: ORGANIZATION,
  role: ROLE,
};

export default OrganizationCard;
