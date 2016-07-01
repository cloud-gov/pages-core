import React from 'react';

const propTypes = {
  site: React.PropTypes.object
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
        let message;
        let rowClass = `usa-alert-${build.state}`;
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
            <td>{ build.user }</td>
            <td>{ build.completedAt }</td>
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
