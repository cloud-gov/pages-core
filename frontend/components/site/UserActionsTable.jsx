import React from 'react';
import PropTypes from 'prop-types';
import { USER_ACTION } from '../../propTypes';
import { dayAndDate } from '../../util/datetime';

const propTypes = {
  userActions: PropTypes.arrayOf(USER_ACTION),
};
const defaultProps = {
  userActions: [],
};

const sortActions = array =>
  array.sort((a, b) => {
    const dateA = new Date(a.createdAt);
    const dateB = new Date(b.createdAt);
    let result;

    if (dateA > dateB) {
      result = -1;
    } else if (dateA < dateB) {
      result = 1;
    } else {
      result = 0;
    }

    return result;
  });

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
          Performed on
        </th>
      </tr>
    </thead>
    <tbody>
      {sortActions(userActions).map(action =>
        <tr key={`${action.id}-${action.targetType}`}>
          <th>{action.actionType.action}</th>
          <th>{action.actionTarget.username}</th>
          <th>{dayAndDate(action.createdAt)}</th>
        </tr>
      )}
    </tbody>
  </table>;

UserActionsTable.propTypes = propTypes;
UserActionsTable.defaultProps = defaultProps;

export default UserActionsTable;
