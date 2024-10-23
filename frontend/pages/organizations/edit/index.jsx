import React, { useEffect, useReducer } from 'react';
import { useParams } from 'react-router-dom';
import { success } from 'react-notification-system-redux';
import { useSelector } from 'react-redux';

import federalistApi from '@util/federalistApi';
import { sandboxMsg } from '@util';

import LoadingIndicator from '@shared/LoadingIndicator';
import AlertBanner from '@shared/alertBanner';

import AddUserForm from './AddUserForm';
import OrganizationTable from './OrganizationTable';

function successNotification(message) {
  return success({
    message,
    title: 'Success',
    position: 'tr',
    autoDismiss: 3,
  });
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

function OrganizationEdit() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const currentUser = useSelector(({ user }) => user.data);
  const { id } = useParams();

  useEffect(() => {
    const fetchInitialData = async () => {
      const [members, org, roles] = await Promise.all([
        federalistApi.fetchOrganizationMembers(id),
        federalistApi.fetchOrganization(id),
        federalistApi.fetchRoles(),
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
      <div className="grid-row">
        <h3>Could not find this organization.</h3>
      </div>
    );
  }

  const roleOptions = roles.map(role => ({ value: role.id, label: role.name }));

  const currentMember = members.find(member => member.User.id === currentUser.id);
  const sortedMembers = members
    .filter(member => member.User.id !== currentUser.id)
    .sort((a, b) => a.User.UAAIdentity.email > b.User.UAAIdentity.email);

  return (
    <div className="grid-col-12">
      <div className="page-header grid-row">
        <div className="desktop:grid-col-6">
          <h1>{org.name}</h1>
        </div>
      </div>

      <div className="well">
        { org.isSandbox
          && (
          <AlertBanner
            status="warning"
            message={sandboxMsg(org.daysUntilSandboxCleaning)}
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
        <h3 className="font-heading-xl">Members</h3>
        <AddUserForm
          className="well"
          roleOptions={roleOptions}
          onSubmit={
            data => federalistApi.inviteToOrganization(org.id, data)
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
        <OrganizationTable
          org={org}
          currentMember={currentMember}
          sortedMembers={sortedMembers}
          roleOptions={roleOptions}
          dispatch={dispatch}
          successNotification={successNotification}
        />
      </div>
    </div>
  );
}

export { OrganizationEdit };
export default OrganizationEdit;
