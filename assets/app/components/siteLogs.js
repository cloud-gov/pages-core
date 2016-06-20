import React from 'react';

class SiteLogs extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div>
        <div className="usa-grid header">
          <div className="usa-width-two-thirds">
            <img className="header-icon" src="/images/website.svg" alt="Websites icon" />
            <div className="header-title">
              <h1>{ this.props.repository }</h1>
              <p>Logs</p>
            </div>
          </div>
          <div className="usa-width-one-third">
            <a className="usa-button usa-button-big pull-right icon icon-view icon-white"
                href={ this.props.viewLink }
                alt="View this website" role="button" target="_blank">View Website</a>
          </div>
        </div>
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

SiteLogs.propTypes = {
  builds: React.PropTypes.array,
  repository: React.PropTypes.string,
  viewLink: React.PropTypes.string
};

export default SiteLogs;
