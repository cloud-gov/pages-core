import React from 'react';
import PropTypes from 'prop-types';
import autoBind from 'react-autobind';
import { connect } from 'react-redux';
import { Link } from '@reach/router';

import GitHubLink from '../GitHubLink';
import { BUILD } from '../../propTypes';
import buildActions from '../../actions/buildActions';
import { currentSite } from '../../selectors/site';
import LoadingIndicator from '../LoadingIndicator';
import RefreshBuildsButton from './refreshBuildsButton';
import { duration, timeFrom } from '../../util/datetime';
import AlertBanner from '../alertBanner';
import CreateBuildLink from '../CreateBuildLink';
import BranchViewLink from '../branchViewLink';
import {
  IconCheckCircle, IconClock, IconExclamationCircle, IconSpinner,
} from '../icons';

export const REFRESH_INTERVAL = 15 * 1000;

const buildStateData = ({ state, error }) => {
  let messageIcon;
  switch (state) {
    case 'error':
      messageIcon = {
        message: error === 'The build timed out' ? 'Timed out' : 'Failed',
        icon: IconExclamationCircle,
      };
      break;
    case 'processing':
      messageIcon = { message: 'In progress', icon: IconSpinner };
      break;
    case 'skipped':
      messageIcon = { message: 'Skipped', icon: null };
      break;
    case 'queued':
      messageIcon = { message: 'Queued', icon: IconClock };
      break;
    case 'success':
      messageIcon = { message: 'Completed', icon: IconCheckCircle };
      break;
    default:
      messageIcon = { message: state, icon: null };
  }
  return messageIcon;
};

class SiteBuilds extends React.Component {
  static buildLogsLink(build) {
    return <Link to={`/sites/${build.site.id}/builds/${build.id}/logs`}>View logs</Link>;
  }

  static commitLink(build) {
    const { owner, repository } = build.site;

    return (
      <GitHubLink
        owner={owner}
        repository={repository}
        sha={build.requestedCommitSha}
        branch={build.requestedCommitSha ? null : build.branch}
        text={build.branch}
      />
    );
  }

  constructor(props) {
    super(props);
    this.state = { autoRefresh: false };
    autoBind(this, 'toggleAutoRefresh');
  }

  /* eslint-disable scanjs-rules/call_setInterval */
  componentDidMount() {
    const { actions, id } = this.props;

    const { fetchBuilds } = actions;
    fetchBuilds({ id });
    this.intervalHandle = setInterval(() => {
      const { autoRefresh } = this.state;
      if (autoRefresh) {
        fetchBuilds({ id });
      }
    }, REFRESH_INTERVAL);
  }
  /* eslint-enable scanjs-rules/call_setInterval */

  componentWillUnmount() {
    clearInterval(this.intervalHandle);
  }

  toggleAutoRefresh() {
    this.setState(state => ({ autoRefresh: !state.autoRefresh }));
  }

  latestBuildByBranch(builds) {
    const maxBuilds = {};
    const branchNames = [...new Set(builds.map(item => item.branch))];
    branchNames.forEach((branchName) => {
      let successes = builds.filter(b => b.branch === branchName && b.state === 'success');
      successes = successes.sort((a, b) => (new Date(b.completedAt) - new Date(a.completedAt)));
      if (successes.length > 0) {
        maxBuilds[branchName] = successes[0].id;
      }
    });
    return maxBuilds;
  }

  renderEmptyState() {
    const { site } = this.props;
    const header = 'This site does not yet have any builds.';
    const message = 'If this site was just added, the first build should be available within a few minutes.';
    return (
      <AlertBanner status="info" header={header} message={message}>
        <RefreshBuildsButton site={site} />
      </AlertBanner>
    );
  }

  renderBuildsTable() {
    const { site, builds, actions } = this.props;
    const { autoRefresh } = this.state;
    const previewBuilds = builds.data && this.latestBuildByBranch(builds.data);
    return (
      <div>
        <div className="log-tools">
          <div>
            {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
            <a
              href="#"
              role="button"
              onClick={this.toggleAutoRefresh}
              data-test="toggle-auto-refresh"
            >
              Auto Refresh:
              {' '}
              <b>{autoRefresh ? 'ON' : 'OFF'}</b>
            </a>
            <RefreshBuildsButton site={site} />
          </div>
        </div>
        { builds.isLoading
          ? <LoadingIndicator />
          : (
            <div className="table-container">
              <table
                className="usa-table-borderless log-table log-table__site-builds table-full-width"
              >
                <thead>
                  <tr>
                    <th scope="col">Branch</th>
                    <th scope="col">Message</th>
                    <th scope="col">User</th>
                    <th scope="col">Completed</th>
                    <th scope="col">Duration</th>
                    <th scope="col">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {builds.data.map((build) => {
                    const { message, icon } = buildStateData(build);

                    return (
                      <tr key={build.id}>
                        <th scope="row" data-title="Branch">
                          <div>
                            <p className="commit-link truncate">
                              { icon && React.createElement(icon) }
                              { SiteBuilds.commitLink(build) }
                            </p>
                            <div>
                              { previewBuilds[build.branch] === build.id && build.state === 'success'
                            && (
                            <BranchViewLink
                              branchName={build.branch}
                              viewLink={build.viewLink}
                              site={site}
                              showIcon
                              completedAt={build.completedAt}
                            />
                            ) }
                            </div>
                          </div>
                        </th>
                        <td data-title="Message">
                          <div>
                            <p>{ message }</p>
                            { SiteBuilds.buildLogsLink(build) }
                          </div>
                        </td>
                        <td data-title="User"><span>{ build.username }</span></td>
                        <td data-title="Completed"><span>{ timeFrom(build.completedAt) }</span></td>
                        <td data-title="Duration">
                          <span>
                            { duration(build.startedAt, build.completedAt) }
                          </span>
                        </td>
                        <td data-title="Actions" className="table-actions">
                          <span>
                            {
                            ['error', 'success'].includes(build.state)
                            && (
                            <CreateBuildLink
                              handlerParams={{ buildId: build.id, siteId: site.id }}
                              handleClick={actions.restartBuild}
                              className="usa-button usa-button-secondary"
                            >
                              Rebuild
                            </CreateBuildLink>
                            )
                          }
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              { builds.data.length >= 100
                ? <p>List only displays 100 most recent builds.</p>
                : null }
            </div>
          )}
      </div>
    );
  }

  render() {
    const { builds } = this.props;

    if (!builds.isLoading && !builds.data.length) {
      return this.renderEmptyState();
    }
    return this.renderBuildsTable();
  }
}

SiteBuilds.propTypes = {
  id: PropTypes.string.isRequired,
  builds: PropTypes.shape({
    isLoading: PropTypes.bool,
    data: PropTypes.arrayOf(BUILD),
  }),
  site: PropTypes.shape({
    id: PropTypes.number,
  }),
  actions: PropTypes.shape({
    fetchBuilds: PropTypes.func.isRequired,
    restartBuild: PropTypes.func.isRequired,
  }),
};

SiteBuilds.defaultProps = {
  builds: null,
  site: null,
  actions: {
    fetchBuilds: buildActions.fetchBuilds,
    restartBuild: buildActions.restartBuild,
  },
};

const mapStateToProps = ({ builds, sites }, { id }) => ({
  builds,
  site: currentSite(sites, id),
});

export { SiteBuilds };
export default connect(mapStateToProps)(SiteBuilds);
