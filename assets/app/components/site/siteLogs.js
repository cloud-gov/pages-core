import React from 'react';

class SiteLogs extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div>
        <div className="usa-grid">
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
              { this.props.builds.map((build) => {
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
                      <td>yo</td>
                      <td>{ message }</td>
                    </tr>
                  )
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }
}

SiteLogs.defaultProps = {
  builds: []
};

SiteLogs.propTypes = {
  builds: React.PropTypes.array,
  repository: React.PropTypes.string
};

export default SiteLogs;
