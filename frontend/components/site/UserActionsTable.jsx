import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';

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

function UserActionsTable(props) {
  const { site } = props;
  const actions = useSelector(state => state.userActions.data);

  useEffect(() => {
    userActions.fetchUserActions(site);
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

UserActionsTable.propTypes = {
  site: PropTypes.number.isRequired,
};

export { UserActionsTable };
export default UserActionsTable;
