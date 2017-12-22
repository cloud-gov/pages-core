import React from 'react';
import PropTypes from 'prop-types';
import { USER_ACTION } from '../../propTypes';

const propTypes = {
  userActions: PropTypes.arrayOf(USER_ACTION),
};

const userAction = (action) =>
  <tr>
    <th>action</th>
  </tr>

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

      </tbody>
    </table>
  );
};

UserActionsTable.propTypes = propTypes;

export default UserActionsTable;
