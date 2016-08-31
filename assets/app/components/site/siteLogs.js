import React from 'react';
import { duration, timeFrom } from '../../util/datetime';

const propTypes = {
  site: React.PropTypes.object
};

const getUsername = (site, id) => {
  const user = site.users.find(user => user.id === id);
  return user.username;
};

const SiteLogs = ({site}) =>
  <table className="usa-table-borderless build-log-table">
    <thead>
      <tr>
        <th scope="col">Branch</th>
        <th scope="col">User</th>
        <th scope="col">Completed</th>
        <th scope="col">Duration</th>
        <th scope="col">Message</th>
      </tr>
    </thead>
    <tbody>
      {site.builds.map((build) => {
        const rowClass = `usa-alert-${build.state}`;
        const username = getUsername(site, build.user);

        let message;

        switch (build.state) {
          case 'error':
            message = build.error;
            break;
          case 'processing':
            message = 'This build is in progress';
            break;
          default:
            message = 'The build completed successfully.';
            break;
        }

        return (
          <tr key={ build.id } className={ rowClass }>
            <td scope="row">{ build.branch }</td>
            <td>{ username }</td>
            <td>{ timeFrom(build.completedAt) }</td>
            <td>{ duration(build.createdAt, build.completedAt) }</td>
            <td>{ message }</td>
          </tr>
        )
      })}
    </tbody>
  </table>

SiteLogs.defaultProps = {
  builds: []
};

SiteLogs.propTypes = propTypes;

export default SiteLogs;
