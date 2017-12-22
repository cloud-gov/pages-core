import React from 'react';
import PropTypes from 'prop-types';
import { USER_ACTION } from '../../propTypes';

const propTypes = {
  userActions: PropTypes.arrayOf(USER_ACTION).isRequired,
};

const userAction = action =>
  <tr>
    <th>{action.actionType.action}</th>
    <th>{action.actionTarget[0].username}</th>
    <th>{action.createdAt}</th>
  </tr>;

const UserActionsTable = ({ userActions }) =>
  <table>
    <thead>
      <tr>
        <th>
          Action
        </th>
        <th>
          Target
        </th>
        <th>
          Performed on
        </th>
      </tr>
    </thead>
    <tbody>
      {userActions.map(action => userAction(action))}
    </tbody>
  </table>;

UserActionsTable.propTypes = propTypes;
UserActionsTable.defaultProps = {
  userActions: [],
};

export default UserActionsTable;
