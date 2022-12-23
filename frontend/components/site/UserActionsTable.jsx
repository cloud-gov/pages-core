import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useParams } from '@reach/router';

import { timestampUTC } from '../../util/datetime';
import userActions from '../../actions/userActions';

function renderRow(action) {
  return (
    <tr key={`${action.id}-${action.targetType}`}>
      <td>{action.initiator.username}</td>
      <td>{action.actionType.action}</td>
      <td>{action.actionTarget.username}</td>
      <td>{timestampUTC(action.createdAt)}</td>
    </tr>
  );
}

function renderTableHead() {
  return (
    <thead>
      <tr>
        <th>
          Initiator
        </th>
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
  );
}

function UserActionsTable() {
  const { id } = useParams();
  const actions = useSelector(state => state.userActions.data);

  useEffect(() => {
    userActions.fetchUserActions(id);
  }, []);

  if (!actions || !actions.length) {
    return null;
  }

  return (
    <table className="table-full-width log-table">
      <caption>Action Log</caption>
      {renderTableHead()}
      <tbody>
        {actions.map(renderRow)}
      </tbody>
    </table>
  );
}

export { UserActionsTable };
export default UserActionsTable;
