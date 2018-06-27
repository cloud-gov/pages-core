import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link } from 'react-router';

import GitHubLink from '../GitHubLink';
import { BUILD } from '../../propTypes';
import buildActions from '../../actions/buildActions';
import LoadingIndicator from '../LoadingIndicator';
import RefreshBuildsButton from './refreshBuildsButton';
import { duration, timeFrom } from '../../util/datetime';
import AlertBanner from '../alertBanner';
import CreateBuildLink from '../CreateBuildLink';

class SiteBuilds extends React.Component {
  static getUsername(build) {
    if (build.user) {
      return build.user.username;
    }
    return '';
  }

  static buildLogsLink(build) {
    return <Link to={`/sites/${build.site.id}/builds/${build.id}/logs`}>View logs</Link>;
  }

  static renderLoadingState() {
    return <LoadingIndicator />;
  }

  static commitLink(build) {
    if (!build.commitSha) {
      return null;
    }

    const { owner, repository } = build.site;

    return (
      <span>
        <br />
        <GitHubLink
          owner={owner}
          repository={repository}
          sha={build.commitSha}
          title={build.commitSha}
          text="View commit"
        />
      </span>
    );
  }

  componentDidMount() {
    buildActions.fetchBuilds(this.props.site);
  }

  renderEmptyState() {
    const message = 'If this site was just added, the ' +
      'first build should be available within a few minutes.';
    return (
      <AlertBanner
        status="info"
        header="This site does not yet have any builds."
        message={message}
      >
        <RefreshBuildsButton site={this.props.site} />
      </AlertBanner>
    );
  }

  renderBuildsTable() {
    const { site, builds } = this.props;
    return (
      <div>
        <div className="log-tools">
          <RefreshBuildsButton site={site} />
        </div>
        <table className="usa-table-borderless log-table log-table__site-builds table-full-width">
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
            {builds.data.map((build) => {
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
                  <th scope="row">
                    { build.branch }
                    { SiteBuilds.commitLink(build) }
                  </th>
                  <td>{ SiteBuilds.getUsername(build) }</td>
                  <td>{ timeFrom(build.completedAt) }</td>
                  <td>{ duration(build.createdAt, build.completedAt) }</td>
                  <td><pre>{ message }</pre></td>
                  <td className="table-actions">
                    { SiteBuilds.buildLogsLink(build) }
                    <CreateBuildLink
                      handlerParams={{ buildId: build.id, siteId: site.id }}
                      handleClick={buildActions.restartBuild}
                      class="usa-button usa-button-secondary"
                    >
                      <br />
                      Rebuild branch
                    </CreateBuildLink>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        { builds.data.length >= 100 ? <p>List only displays 100 most recent builds.</p> : null }
      </div>
    );
  }

  render() {
    const { builds } = this.props;

    if (builds.isLoading) {
      return SiteBuilds.renderLoadingState();
    } else if (!builds.data.length) {
      return this.renderEmptyState();
    }
    return this.renderBuildsTable();
  }
}

SiteBuilds.propTypes = {
  builds: PropTypes.shape({
    isLoading: PropTypes.boolean,
    data: PropTypes.arrayOf(BUILD),
  }),
  site: PropTypes.shape({
    id: PropTypes.number,
  }),
};

SiteBuilds.defaultProps = {
  builds: null,
  site: null,
};

const mapStateToProps = state => ({
  builds: state.builds,
  site: state.sites.currentSite,
});

export { SiteBuilds };
export default connect(mapStateToProps)(SiteBuilds);
