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
    <div>
      <div className="grid-row">
        <h1>Your organizations</h1>
      </div>

      {(() => {
        if (isLoading) {
          return <LoadingIndicator />;
        }

        if (!orgRoles || !orgRoles.length) {
          return (
            <div className="usa-grid">
              <h3>You do not belong to any organizations.</h3>
            </div>
          );
        }

        const getSandboxMsg = (days) => <em>{sandboxMsg(days)}</em>;

        return (
          <div className="grid-row">
            <ul className="sites-list usa-unstyled-list">
              {orgRoles.map(({ Organization, Role }) => (
                <li key={Organization.id} className="sites-list-item">
                  <div className="sites-list-item-text">
                    <h4 className="site-list-item-title">
                      {Organization.name}
                    </h4>
                    {Organization.isSandbox && (
                      <p>
                        {getSandboxMsg(Organization.daysUntilSandboxCleaning)}
                      </p>
                    )}
                  </div>
                  <div className="sites-list-item-actions">
                    {!Organization.isActive
                      ? 'Inactive'
                      : Role.name === 'manager' && (
                          <Link
                            to={`/organizations/${Organization.id}`}
                            title="Edit organization"
                          >
                            Edit
                          </Link>
                        )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        );
      })()}

      <a href="#top" className="back-to-top">
        Return to top
      </a>
    </div>
  );
}

List.propTypes = {
  actions: PropTypes.shape({
    fetchOrganizationRoles: PropTypes.func.isRequired,
  }).isRequired,
};

const WrappedList = (props) => (
  <List
    actions={{
      fetchOrganizationRoles: federalistApi.fetchOrganizationRoles,
    }}
    {...props}
  />
);

export { List };
export default WrappedList;
