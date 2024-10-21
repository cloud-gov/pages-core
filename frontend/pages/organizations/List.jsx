import React from 'react';
import PropTypes from 'prop-types';

import LoadingIndicator from '@shared/LoadingIndicator';
import { useOrganizationRoles } from '@hooks/useOrganizationRoles';
import OrganizationCard from './components/OrganizationCard';

function ListLayout({ children }) {
  return (
    <div className="grid-row">
      <div className="grid-col-12">
        <h1 className="font-sans-2xl">Your organizations</h1>
      </div>
      {children}
    </div>
  );
}

ListLayout.propTypes = {
  children: PropTypes.node,
};

function List() {
  const { isLoading, orgRoles } = useOrganizationRoles();

  if (isLoading) {
    return (
      <ListLayout>
        <LoadingIndicator />
      </ListLayout>
    );
  }

  if (!orgRoles || !orgRoles.length) {
    return (
      <ListLayout>
        <div className="grid-row">
          <h3>You do not belong to any organizations.</h3>
        </div>
      </ListLayout>
    );
  }

  return (
    <div className="grid-col-12">
      <ul className="usa-card-group">
        {orgRoles.map(({ Organization, Role }) => (
          <OrganizationCard
            organization={Organization}
            role={Role}
            key={Organization.id}
          />
        ))}
      </ul>
    </div>
  );
}

export { List };
export default List;
