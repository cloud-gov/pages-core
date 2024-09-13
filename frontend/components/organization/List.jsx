import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import federalistApi from '../../util/federalistApi';
import LoadingIndicator from '../LoadingIndicator';
import { sandboxMsg } from '../../util';

function List({ actions }) {
  const [{ isLoading, orgRoles }, setState] = useState({
    isLoading: true,
    orgRoles: null,
  });

  useEffect(() => {
    const fetchInitialData = async () => {
      const data = await actions.fetchOrganizationRoles();
      setState({ isLoading: false, orgRoles: data });
    };
    fetchInitialData();
  }, ['1']);

  return (
    <div className="grid-row">
      <div className="grid-col-12">
        <h1 className="font-sans-2xl">Your organizations</h1>
      </div>

      {(() => {
        if (isLoading) {
          return <LoadingIndicator />;
        }

        if (!orgRoles || !orgRoles.length) {
          return (
            <div className="grid-row">
              <h3>You do not belong to any organizations.</h3>
            </div>
          );
        }

        const getSandboxMsg = days => <em>{sandboxMsg(days)}</em>;

        return (
          <div className="grid-col-12">
            <ul className="usa-card-group">
              {orgRoles.map(({ Organization, Role }) => (
                <li key={Organization.id} className="usa-card tablet-lg:grid-col-6">
                  <div className="usa-card__container bg-base-lightest">
                    <div className="usa-card__header">
                      <h4 className="usa-card__heading text-normal">
                        {Organization.name}
                      </h4>
                    </div>
                    <div className="usa-card__body">
                      {Organization.isSandbox && (
                        <p>
                          {getSandboxMsg(Organization.daysUntilSandboxCleaning)}
                        </p>
                      )}
                    </div>
                    <div className="usa-card__footer">
                      {!Organization.isActive
                        ? 'Inactive'
                        : Role.name === 'manager' && (
                          <Link
                            className="usa-button usa-button--outline"
                            to={`/organizations/${Organization.id}`}
                            title="Edit organization"
                          >
                            Edit
                          </Link>
                        )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        );
      })()}
    </div>
  );
}

List.propTypes = {
  actions: PropTypes.shape({
    fetchOrganizationRoles: PropTypes.func.isRequired,
  }).isRequired,
};

const WrappedList = props => (
  <List
    actions={{
      fetchOrganizationRoles: federalistApi.fetchOrganizationRoles,
    }}
    {...props}
  />
);

export { List };
export default WrappedList;
