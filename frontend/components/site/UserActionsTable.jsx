import React from 'react';
import PropTypes from 'prop-types';
import { USER_ACTION } from '../../propTypes';
import { timeFrom } from '../../util/datetime';

const propTypes = {
  userActions: PropTypes.arrayOf(USER_ACTION),
};
const defaultPropTypes = {
  userActions: [],
};

const UserActionsTable = ({ userActions }) => {
  return (
    <table>
      <thead>
        <tr>
          <th>
            Action
          </th>
          <th>
            targetId
          </th>
          <th>
            Performed on
          </th>
        </tr>
      </thead>
      <tbody>
        {userActions.map((action) =>
          <tr key={`${action.id}-${action.targetType}`}>
            <th>{action.actionType.action}</th>
            <th>{action.actionTarget.username}</th>
            <th>{timeFrom(action.createdAt)}</th>
          </tr>
        )}
      </tbody>
    </table>
  );
};

UserActionsTable.propTypes = propTypes;
UserActionsTable.defaultPropTypes = defaultPropTypes;

export default UserActionsTable;
