import React from 'react';
import PropTypes from 'prop-types';
import { USER_ENVIRONMENT_VARIABLE } from '../../../propTypes';

const EnvironmentVariableTable = ({ uevs, onDelete }) => (
  <table className="usa-table-borderless table-full-width">
    <caption>Current Environment Variables</caption>
    <thead>
      <tr>
        <th scope="col">Name</th>
        <th scope="col">Value</th>
        <th scope="col" className="text-right">Remove</th>
      </tr>
    </thead>
    <tbody>
      {uevs.map(uev => (
        <tr key={uev.id}>
          <th scope="row">{uev.name}</th>
          <td>{`xxxx${uev.hint}`}</td>
          <td className="text-right">
            <button
              type="button"
              className="margin-0"
              onClick={() => onDelete(uev.id)}
            >
              X
            </button>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
);

EnvironmentVariableTable.propTypes = {
  onDelete: PropTypes.func.isRequired,
  uevs: PropTypes.arrayOf(USER_ENVIRONMENT_VARIABLE).isRequired,
};

export default EnvironmentVariableTable;
