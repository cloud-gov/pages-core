import React from 'react';
import PropTypes from 'prop-types';
import { USER_ACTION } from '../../propTypes';
import { timestampUTC } from '../../util/datetime';

const propTypes = {
  userActions: PropTypes.arrayOf(USER_ACTION),
};
const defaultProps = {
  userActions: [],
};

const UserActionsTable = ({ userActions }) =>
  <table>
    <caption>Action Log (All actions performed across all sites)</caption>
    <thead>
      <tr>
        <th>
          Action
        </th>
        <th>
          Target
        </th>
        <th>
          Timestamp (UTC)
        </th>
      </tr>
    </thead>
    <tbody>
      {userActions.map(action =>
        <tr key={`${action.id}-${action.targetType}`}>
          <td>{action.actionType.action}</td>
          <td>{action.actionTarget.username}</td>
          <td>{timestampUTC(action.createdAt)}</td>
        </tr>
      )}
    </tbody>
  </table>;

UserActionsTable.propTypes = propTypes;
UserActionsTable.defaultProps = defaultProps;

export default UserActionsTable;
