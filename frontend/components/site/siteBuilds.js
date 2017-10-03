import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router';

import buildActions from '../../actions/buildActions';
import LoadingIndicator from '../loadingIndicator';
import RefreshBuildsButton from './refreshBuildsButton';
import { duration, timeFrom } from '../../util/datetime';


class SiteBuilds extends React.Component {
  static getUsername(build) {
    if (build.user) {
      return build.user.username;
    }
    return '';
  }

  static restartClicked(event, build) {
    event.preventDefault();
    buildActions.restartBuild(build);
  }

  static buildLogsLink(build) {
    return <Link to={`/sites/${build.site.id}/builds/${build.id}/logs`}>Logs</Link>;
  }

  static renderLoadingState() {
    return <LoadingIndicator />;
  }

  static restartLink(build) {
    /* eslint-disable jsx-a11y/href-no-hash */
    return (
      <a
        href="#"
        role="button"
        onClick={e => SiteBuilds.restartClicked(e, build)}
      >
        Restart
      </a>
    );
    /* eslint-enable jsx-a11y/href-no-hash */
  }

  componentDidMount() {
    buildActions.fetchBuilds(this.props.site);
  }

  builds() {
    if (this.props.builds.isLoading || !this.props.builds.data) {
      return [];
    }
    return this.props.builds.data;
  }

  renderEmptyState() {
    return (
      <div>
        <p>This site does not have any builds.</p>
        <RefreshBuildsButton site={this.props.site} />
      </div>
    );
  }

  renderBuildsTable() {
    return (
      <div>
        <div className="log-tools">
          <RefreshBuildsButton site={this.props.site} />
        </div>
        <table className="usa-table-borderless log-table log-table__site-builds">
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
            {this.builds().map((build) => {
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
                <tr key={build.id}>
                  <td>{ build.branch }</td>
                  <td>{ SiteBuilds.getUsername(build) }</td>
                  <td>{ timeFrom(build.completedAt) }</td>
                  <td>{ duration(build.createdAt, build.completedAt) }</td>
                  <td><pre>{ message }</pre></td>
                  <td>
                    { SiteBuilds.restartLink(build) }<br />
                    { SiteBuilds.buildLogsLink(build) }
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        { this.builds().length >= 100 ? <p>List only displays 100 most recent builds.</p> : null }
      </div>
    );
  }

  render() {
    const builds = this.builds();
    if (this.props.builds.isLoading) {
      return SiteBuilds.renderLoadingState();
    } else if (!builds.length) {
      return this.renderEmptyState();
    }
    return this.renderBuildsTable();
  }
}

SiteBuilds.propTypes = {
  builds: PropTypes.shape({
    isLoading: PropTypes.boolean,
    data: PropTypes.arrayOf(PropTypes.shape({
      id: PropTypes.number,
      state: PropTypes.string,
      error: PropTypes.string,
      branch: PropTypes.string,
      completedAt: PropTypes.string,
      createdAt: PropTypes.string,
      user: PropTypes.shape({
        username: PropTypes.string,
      }),
    })),
  }),
  site: PropTypes.shape({
    id: PropTypes.number,
  }),
};

SiteBuilds.defaultProps = {
  builds: null,
  site: null,
};

export default SiteBuilds;
