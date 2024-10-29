import React from 'react';
import PropTypes from 'prop-types';
import { timeFrom } from '@util/datetime';
import federalistApi from '@util/federalistApi';
import { ORGANIZATION } from '@propTypes';

import RemoveUserForm from './RemoveUserForm';
import ResendInviteForm from './ResendInviteForm';
import UpdateUserForm from './UpdateUserForm';

function showRemoveConfirm(member, org) {
  return window.confirm(
    `Are you sure you want to remove ${member.User.UAAIdentity.email} from ${org.name}?`,
  );
}

function OrganizationTable({
  currentMember,
  sortedMembers,
  roleOptions,
  org,
  dispatch,
  successNotification,
}) {
  return (
    <table
      className={`
        usa-table
        usa-table--borderless
        usa-table--stacked
        log-table
        org-member-table
        width-full
        table-full-width
      `}
    >
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
            <th scope="row" data-title="Email">
              {currentMember.User?.UAAIdentity?.email}
            </th>
            <td data-title="Role">manager</td>
            <td data-title="Added">{timeFrom(currentMember?.createdAt)}</td>
            <td data-title="Last Signed In">
              {currentMember?.User?.signedInAt
                ? timeFrom(currentMember.User.signedInAt)
                : 'Never'}
            </td>
            <td label="Actions" data-title="Actions" className="table-actions" />
          </tr>
        )}

        {sortedMembers.map((member) => (
          <tr key={member.User.id}>
            <th scope="row" data-title="Email">
              {member.User.UAAIdentity.email}
            </th>
            <td data-title="Role">
              <span className="usa-sr-only">Role</span>
              <UpdateUserForm
                form={`updateOrganizationUser-${member.User.id}`}
                initialValues={{
                  roleId: member.Role.id,
                }}
                roleOptions={roleOptions}
                onSubmit={({ roleId }) =>
                  federalistApi.updateOrganizationRole(org.id, roleId, member.User.id)
                }
                onSubmitSuccess={(updatedMember, reduxDispatch) => {
                  dispatch({
                    type: 'updateMember',
                    payload: updatedMember,
                  });
                  reduxDispatch(successNotification('Successfully updated user.'));
                }}
              />
            </td>
            <td data-title="Added">{timeFrom(member.createdAt)}</td>
            <td data-title="Last Signed In">
              {member.User.signedInAt ? timeFrom(member.User.signedInAt) : 'Never'}
            </td>
            <td data-title="Actions" className="table-actions">
              <span className="usa-sr-only">User actions</span>
              <RemoveUserForm
                form={`removeOrganizationUser-${member.User.id}`}
                onSubmit={() => true}
                onSubmitSuccess={async (_, reduxDispatch) => {
                  if (!showRemoveConfirm(member, org)) {
                    return;
                  }

                  await federalistApi.removeOrganizationRole(org.id, member.User.id);
                  dispatch({
                    type: 'removeMember',
                    payload: member.User.id,
                  });
                  reduxDispatch(successNotification('Successfully removed user.'));
                }}
              />
              {(member.User.UAAIdentity.origin === 'uaa' ||
                member.User.UAAIdentity.origin === 'cloud.gov') &&
                !member.User.signedInAt && (
                  <ResendInviteForm
                    form={`resendInvite-${member.User.id}`}
                    onSubmit={() => true}
                    onSubmitSuccess={async (_, reduxDispatch) => {
                      await federalistApi.inviteToOrganization(org.id, {
                        uaaEmail: member.User.UAAIdentity.email,
                        user: member.User.id,
                        roleID: member.Role.id,
                        isResend: true,
                      });
                      reduxDispatch(
                        successNotification('Successfully resent invitation.'),
                      );
                    }}
                  />
                )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

OrganizationTable.propTypes = {
  org: ORGANIZATION,
  currentMember: PropTypes.object,
  sortedMembers: PropTypes.object,
  roleOptions: PropTypes.object,
  dispatch: PropTypes.func,
  successNotification: PropTypes.func,
};

export default OrganizationTable;
