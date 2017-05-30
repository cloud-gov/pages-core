import PropTypes from 'prop-types';
import React from 'react';
import { Link } from 'react-router';
import LoadingIndicator from '../loadingIndicator'
import { duration, timeFrom } from '../../util/datetime';
import buildActions from '../../actions/buildActions';

class SiteBuilds extends React.Component {
  componentDidMount() {
    buildActions.fetchBuilds(this.props.site)
  }

  builds() {
    if (this.props.builds.isLoading || !this.props.builds.data) {
      return [];
    } else {
      return this.props.builds.data
    }
  }

  render() {
    const builds = this.builds()
    if (this.props.builds.isLoading) {
      return this.renderLoadingState()
    } else if (!builds.length) {
      return this.renderEmptyState()
    } else {
      return this.renderBuildsTable()
    }
  }

  renderBuildsTable() {
    return (
      <table className="usa-table-borderless build-log-table">
        <thead>
          <tr>
            <th scope="col">Branch</th>
            <th scope="col">User</th>
            <th scope="col">Completed</th>
            <th scope="col">Duration</th>
            <th scope="col">Message</th>
            <th scope="col">Actions</th>
          </tr>
        </thead>
        <tbody>
          {this.builds().map(build => {
            const rowClass = `usa-alert-${build.state}`;
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
                <td>{ this.getUsername(build) }</td>
                <td>{ timeFrom(build.completedAt) }</td>
                <td>{ duration(build.createdAt, build.completedAt) }</td>
                <td>{ message }</td>
                <td>
                  { this.restartLink(build) }<br/>
                  { this.buildLogsLink(build) }
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    )
  }

  getUsername(build) {
    if (build.user) {
      return build.user.username
    } else {
      return ""
    }
  }

  restartLink(build) {
    return (
      <a
        href="#" alt="Restart this build"
        onClick={ (e) => this.restartClicked(e, build) }
      >
        Restart
      </a>
    )
  }

  restartClicked(event, build) {
    event.preventDefault()
    buildActions.restartBuild(build);
  }

  buildLogsLink(build) {
    return <Link to={`/sites/${build.site.id}/builds/${build.id}/logs`}>Logs</Link>
  }

  renderLoadingState() {
    return <LoadingIndicator/>
  }

  renderEmptyState() {
    return <p>This site does not have any builds</p>
  }
}

SiteBuilds.propTypes = {
  site: PropTypes.object
};

export default SiteBuilds;
