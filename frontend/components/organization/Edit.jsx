/* global window */
import React, { useEffect, useReducer } from 'react';
import PropTypes from 'prop-types';
import { success } from 'react-notification-system-redux';
import federalistApi from '../../util/federalistApi';
import ExpandableArea from '../ExpandableArea';
import LoadingIndicator from '../LoadingIndicator';
import AddUserForm from './AddUserForm';
import RemoveUserForm from './RemoveUserForm';
import UpdateUserForm from './UpdateUserForm';
import { timeFrom } from '../../util/datetime';

function successNotification(message) {
  return success({
    message,
    title: 'Success',
    position: 'tr',
    autoDismiss: 3,
  });
}

function showInviteAlert(email, link) {
  // eslint-disable-next-line no-alert
  return window.alert(`${email} does not have cloud.gov account yet, please send them the following link to get started:\n\n${link}`);
}

function showRemoveConfirm(member, org) {
  // eslint-disable-next-line no-alert
  return window.confirm(`Are you sure you want to remove ${member.User.UAAIdentity.email} from ${org.name}?`);
}

function reducer(state, { type, payload }) {
  switch (type) {
    case 'init':
      return {
        ...state,
        isLoading: false,
        ...payload,
      };
    case 'addMember':
      return {
        ...state,
        members: [...state.members, payload],
      };
    case 'removeMember':
      return {
        ...state,
        members: state.members.filter(member => member.User.id !== payload),
      };
    case 'updateMember':
      return {
        ...state,
        members: [...state.members.filter(member => member.User.id !== payload.User.id), payload],
      };
    default:
      return state;
  }
}

const initialState = {
  isLoading: true,
  members: [],
  org: null,
  roles: [],
};

function Edit({ actions, id }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    const fetchInitialData = async () => {
      const [members, org, roles] = await Promise.all([
        actions.fetchOrganizationMembers(id),
        actions.fetchOrganization(id),
        actions.fetchRoles(),
      ]);
      dispatch({ type: 'init', payload: { members, org, roles } });
    };
    fetchInitialData();
  }, ['1']);

  const {
    isLoading, members, org, roles,
  } = state;

  if (isLoading) {
    return <LoadingIndicator />;
  }

  if (!org) {
    return (
      <div className="usa-grid">
        <h3>Could not find this organization.</h3>
      </div>
    );
  }

  const roleOptions = roles.map(role => ({ value: role.id, label: role.name }));

  return (
    <div>
      <div className="page-header usa-grid-full">
        <div className="usa-width-one-half">
          <h1>{org.name}</h1>
        </div>
      </div>

      <div className="well">
        <h3>Members</h3>
        <ExpandableArea title="Add user" bordered>
          <AddUserForm
            className="well"
            roleOptions={roleOptions}
            onSubmit={
              data => actions.inviteToOrganization(org.id, data)
            }
            onSubmitSuccess={
              ({ member, invite: { email, link } }, reduxDispatch) => {
                dispatch({ type: 'addMember', payload: member });
                if (link) {
                  showInviteAlert(email, link);
                }
                reduxDispatch(successNotification('Successfully added user.'));
              }
            }
          />
        </ExpandableArea>

        <table className="usa-table-borderless log-table log-table__site-builds table-full-width">
          <thead>
            <tr>
              <th scope="col">Email</th>
              <th scope="col">Role</th>
              <th scope="col">Added</th>
              <th scope="col">Updated</th>
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {members.map(member => (
              <tr key={member.User.id}>
                <th scope="row" data-title="Email">{member.User.UAAIdentity.email}</th>
                <td data-title="Role">
                  <UpdateUserForm
                    form={`updateOrganizationUser-${member.User.id}`}
                    initialValues={{ roleId: member.Role.id }}
                    roleOptions={roleOptions}
                    onSubmit={
                      ({ roleId }) => actions.updateOrganizationRole(org.id, roleId, member.User.id)
                    }
                    onSubmitSuccess={
                      (updatedMember, reduxDispatch) => {
                        dispatch({ type: 'updateMember', payload: updatedMember });
                        reduxDispatch(successNotification('Successfully updated user.'));
                      }
                    }
                  />
                </td>
                <td data-title="Added">
                  {timeFrom(member.createdAt)}
                </td>
                <td data-title="Updated">
                  {timeFrom(member.updatedAt)}
                </td>
                <td data-title="Actions" className="table-actions">
                  <RemoveUserForm
                    form={`removeOrganizationUser-${member.User.id}`}
                    onSubmit={() => true}
                    onSubmitSuccess={
                      async (_, reduxDispatch) => {
                        if (!showRemoveConfirm(member, org)) {
                          return;
                        }

                        await actions.removeOrganizationRole(org.id, member.User.id);
                        dispatch({ type: 'removeMember', payload: member.User.id });
                        reduxDispatch(successNotification('Successfully removed user.'));
                      }
                    }
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <a href="#top" className="back-to-top">Return to top</a>
    </div>
  );
}

Edit.propTypes = {
  id: PropTypes.string.isRequired,
  actions: PropTypes.shape({
    fetchOrganizationMembers: PropTypes.func.isRequired,
    fetchOrganization: PropTypes.func.isRequired,
    fetchRoles: PropTypes.func.isRequired,
    inviteToOrganization: PropTypes.func.isRequired,
    removeOrganizationRole: PropTypes.func.isRequired,
    updateOrganizationRole: PropTypes.func.isRequired,
  }).isRequired,
};

const WrappedEdit = props => (
  <Edit
    actions={{
      fetchOrganizationMembers: federalistApi.fetchOrganizationMembers,
      fetchOrganization: federalistApi.fetchOrganization,
      fetchRoles: federalistApi.fetchRoles,
      inviteToOrganization: federalistApi.inviteToOrganization,
      removeOrganizationRole: federalistApi.removeOrganizationRole,
      updateOrganizationRole: federalistApi.updateOrganizationRole,
    }}
    {...props}
  />
);

export { Edit };
export default WrappedEdit;
