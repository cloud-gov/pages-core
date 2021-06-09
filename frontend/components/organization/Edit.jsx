import React from 'react';
import PropTypes from 'prop-types';
import federalistApi from '../../util/federalistApi';
import Await from '../Await';
import ExpandableArea from '../ExpandableArea';

const Edit = ({ fetchOrganization, id }) => (
  <Await
    on={() => fetchOrganization(id)}
    missing="Could not find this organization."
    render={
      org => (
        <div>
          <div className="page-header usa-grid-full">
            <div className="usa-width-one-half">
              <h1>{org.name}</h1>
            </div>
          </div>

          <div className="well">
            <h3>Settings</h3>
            <form action="">
              <fieldset>
                <legend className="usa-sr-only">Settings</legend>
                <label htmlFor="name">Name</label>
                <input type="text" name="name" id="name" required />
              </fieldset>
              <button
                type="submit"
                className="usa-button usa-button-primary"
                disabled={false}
              >
                Save settings
              </button>
            </form>
          </div>

          <div className="well">
            <h3>Members</h3>
            <ExpandableArea title="Invite user" bordered>
              <form action="">
                <fieldset>
                  <legend className="usa-sr-only">Invite User</legend>
                  <label htmlFor="uaaEmail">Email</label>
                  <input type="text" name="uaaEmail" id="uaaEmail" required />
                  <label htmlFor="role">Role</label>
                  <select name="role" id="role" required>
                    <option>--</option>
                    <option value="1">User</option>
                    <option value="2">Manager</option>
                  </select>
                  <label htmlFor="githubUsername">Github Username</label>
                  <input type="text" name="githubUsername" id="githubUsername" />
                </fieldset>
                <button
                  type="submit"
                  className="usa-button usa-button-primary"
                  disabled={false}
                >
                  Invite
                </button>
              </form>
            </ExpandableArea>
          </div>

          <a href="#top" className="back-to-top">Return to top</a>
        </div>
      )
    }
  />
);

Edit.propTypes = {
  fetchOrganization: PropTypes.func.isRequired,
  id: PropTypes.string.isRequired,
};

export { Edit };
export default props => <Edit {...props} fetchOrganization={federalistApi.fetchOrganization} />;
