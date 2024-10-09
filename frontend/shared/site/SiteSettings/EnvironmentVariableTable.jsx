import React from 'react';
import PropTypes from 'prop-types';
import { USER_ENVIRONMENT_VARIABLE } from '../../../propTypes';
import { IconTrash } from '../../icons';

const EnvironmentVariableTable = ({ uevs, onDelete }) => (
  <table className="usa-table usa-table--borderless usa-table--stacked width-full">
    <caption className="font-heading-md">Current Environment Variables</caption>
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
          <th className="font-mono-sm" scope="row">{uev.name}</th>
          <td className="font-mono-sm">{`xxxx${uev.hint}`}</td>
          <td className="text-right">
            <button
              type="button"
              className="margin-0 usa-button usa-button--secondary"
              onClick={() => onDelete(uev.id)}
            >
              <span className="usa-sr-only">Delete</span>
              <IconTrash />
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
