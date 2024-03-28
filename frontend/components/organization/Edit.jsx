import React, { useEffect, useReducer } from 'react';
import { useParams } from 'react-router-dom';
import { success } from 'react-notification-system-redux';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import federalistApi from '../../util/federalistApi';
import LoadingIndicator from '../LoadingIndicator';
import AddUserForm from './AddUserForm';
import RemoveUserForm from './RemoveUserForm';
import ResendInviteForm from './ResendInviteForm';
import UpdateUserForm from './UpdateUserForm';
import { timeFrom } from '../../util/datetime';
import { sandboxMsg } from '../../util';
import AlertBanner from '../alertBanner';

function successNotification(message) {
  return success({
    message,
    title: 'Success',
    position: 'tr',
    autoDismiss: 3,
  });
}

function showRemoveConfirm(member, org) {
  // eslint-disable-next-line no-alert
  return window.confirm(`Are you sure you want to remove ${member.User.UAAIdentity.email} from ${org.name}?`);
}

function getInvitationSentMsg(mostRecentlyAddedUser) {
  return (
    <span>
      The new member must create a Pages account to accept the invitation to this organization.
      They may check their inbox at
      {' '}
      {mostRecentlyAddedUser.email}
      {' '}
      for an invitation by email or visit
      {' '}
      <a href={`${mostRecentlyAddedUser.link}`}>{mostRecentlyAddedUser.link}</a>
      {' '}
      to get started.
    </span>
  );
}

function reducer(state, { type, payload }) {
  switch (type) {
    case 'init':
      return {
        ...state,
        isLoading: false,
        ...payload,
      };
    case 'invitationSent':
      return {
        ...state,
        mostRecentlyAddedUser: payload,
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
  mostRecentlyAddedUser: null,
};

function Edit({ actions }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const currentUser = useSelector(({ user }) => user.data);
  const { id } = useParams();

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
    isLoading, members, org, roles, mostRecentlyAddedUser,
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

  const currentMember = members.find(member => member.User.id === currentUser.id);
  const sortedMembers = members
    .filter(member => member.User.id !== currentUser.id)
    .sort((a, b) => a.User.UAAIdentity.email > b.User.UAAIdentity.email);

  const getSandboxMsg = days => <span>{sandboxMsg(days)}</span>;

  return (
    <div>
      <div className="page-header usa-grid-full">
        <div className="usa-width-one-half">
          <h1>{org.name}</h1>
        </div>
      </div>

      <div className="well">
        { org.isSandbox
          && (
          <AlertBanner
            status="warning"
            message={getSandboxMsg(org.daysUntilSandboxCleaning)}
            alertRole={false}
          />
          )}
        { mostRecentlyAddedUser
          && (
          <AlertBanner
            status="info"
            header="Sent invitation to create a Pages account"
            message={getInvitationSentMsg(mostRecentlyAddedUser)}
            alertRole={false}
          />
          )}
        <h3>Members</h3>
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
                dispatch({ type: 'invitationSent', payload: { email, link } });
              }
              reduxDispatch(successNotification('Successfully added user.'));
            }
          }
        />
        <table className="usa-table-borderless log-table log-table__site-builds org-member-table table-full-width">
          <thead>
            <tr>
              <th scope="col">Email</th>
              <th scope="col">Role</th>
              <th scope="col">Added</th>
              <th scope="col">Last Signed In</th>
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentMember?.User && (
              <tr key={currentMember.User?.id}>
                <th scope="row" data-title="Email">{currentMember.User?.UAAIdentity?.email}</th>
                <td data-title="Role">
                  manager
                </td>
                <td data-title="Added">
                  {timeFrom(currentMember?.createdAt)}
                </td>
                <td data-title="Last Signed In">
                  {currentMember?.User?.signedInAt ? timeFrom(currentMember.User.signedInAt) : 'Never'}
                </td>
                <td label="Actions" data-title="Actions" className="table-actions" />
              </tr>
            )}

            {sortedMembers.map(member => (
              <tr key={member.User.id}>
                <th scope="row" data-title="Email">{member.User.UAAIdentity.email}</th>
                <td data-title="Role">
                  <span className="usa-sr-only">Role</span>
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
                <td data-title="Last Signed In">
                  {member.User.signedInAt ? timeFrom(member.User.signedInAt) : 'Never'}
                </td>
                <td data-title="Actions" className="table-actions">
                  <span className="usa-sr-only">User actions</span>
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
                  { (member.User.UAAIdentity.origin === 'uaa' || member.User.UAAIdentity.origin === 'cloud.gov')
                    && !member.User.signedInAt && (
                    <ResendInviteForm
                      form={`resendInvite-${member.User.id}`}
                      onSubmit={() => true}
                      onSubmitSuccess={
                        async (_, reduxDispatch) => {
                          await actions.inviteToOrganization(
                            org.id,
                            {
                              uaaEmail: member.User.UAAIdentity.email,
                              user: member.User.id,
                              roleID: member.Role.id,
                              isResend: true,
                            }
                          );
                          reduxDispatch(successNotification('Successfully resent invitation.'));
                        }
                      }
                    />
                  )}
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
  actions: PropTypes.shape({
    fetchOrganizationMembers: PropTypes.func.isRequired,
    fetchOrganization: PropTypes.func.isRequired,
    fetchRoles: PropTypes.func.isRequired,
    inviteToOrganization: PropTypes.func.isRequired,
    resendInviteToOrganization: PropTypes.func,
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
