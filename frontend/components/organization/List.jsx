import React from 'react';
import PropTypes from 'prop-types';
import { Link } from '@reach/router';
import federalistApi from '../../util/federalistApi';
import Await from '../Await';

const List = ({ fetchOrganizationRoles }) => (
  <div>
    <div className="page-header usa-grid-full">
      <div className="usa-width-one-half">
        <h1>
          Your organizations
        </h1>
      </div>
    </div>

    <Await
      on={fetchOrganizationRoles}
      missing="You do not belong to any organizations."
      render={
      orgRoles => (
        <ul className="sites-list usa-unstyled-list">
          { orgRoles.map(({ Organization, Role }) => (
            <li key={Organization.id} className="sites-list-item">
              <div className="sites-list-item-text">
                <h4 className="site-list-item-title">
                  {Organization.name}
                </h4>
              </div>
              <div className="sites-list-item-actions">
                { Role.name === 'manager' && (
                <Link to={`/organizations/${Organization.id}`} title="Edit organization">
                  Edit
                </Link>
                )}
              </div>
            </li>
          ))}
        </ul>
      )
    }
    />

    <a href="#top" className="back-to-top">Return to top</a>
  </div>
);

List.propTypes = {
  fetchOrganizationRoles: PropTypes.func.isRequired,
};

export { List };
export default props => <List {...props} fetchOrganizationRoles={federalistApi.fetchOrganizationRoles} />;
