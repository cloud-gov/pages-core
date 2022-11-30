import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { useParams } from 'react-router-dom';

import { BUILD_LOG } from '../../propTypes';
import buildLogActions from '../../actions/buildLogActions';
import LoadingIndicator from '../LoadingIndicator';
import SiteBuildLogTable from './siteBuildLogTable';
import RefreshBuildLogsButton from './refreshBuildLogsButton';
import DownloadBuildLogsButton from './downloadBuildLogsButton';

export const REFRESH_INTERVAL = 15 * 1000;

class SiteBuildLogs extends React.Component {
  constructor(props) {
    super(props);
    this.state = { autoRefresh: false };
    this.toggleAutoRefresh = this.toggleAutoRefresh.bind(this);
  }

  componentDidMount() {
    const { actions: { fetchBuildLogs } } = this.props;
    const { buildId } = useParams();

    fetchBuildLogs({ id: buildId });
    this.intervalHandle = setInterval(() => {
      const { autoRefresh } = this.state;
      if (autoRefresh) {
        fetchBuildLogs({ id: buildId });
      }
    }, REFRESH_INTERVAL);
  }

  toggleAutoRefresh() {
    this.setState(state => ({ autoRefresh: !state.autoRefresh }));
  }

  render() {
    const { buildLogs } = this.props;
    const { buildId: buildIdStr } = useParams();
    const { autoRefresh } = this.state;
    const buildId = parseInt(buildIdStr, 10);

    if (!buildLogs.isLoading && (!buildLogs || !buildLogs.data || !buildLogs.data.length)) {
      return (
        <div>
          <p>This build does not have any build logs.</p>
          <RefreshBuildLogsButton buildId={buildId} />
        </div>
      );
    }

    return (
      <div>
        <div className="log-tools">
          <ul className="usa-unstyled-list">
            <li><DownloadBuildLogsButton buildId={buildId} buildLogsData={buildLogs.data} /></li>
            <li>
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
              </div>
              <RefreshBuildLogsButton buildId={buildId} />
            </li>
          </ul>
        </div>
        { buildLogs.isLoading
          ? <LoadingIndicator />
          : <SiteBuildLogTable buildLogs={buildLogs.data} />}
      </div>
    );
  }
}

SiteBuildLogs.propTypes = {
  buildLogs: PropTypes.shape({
    isLoading: PropTypes.bool,
    data: PropTypes.arrayOf(BUILD_LOG),
  }),
  actions: PropTypes.shape({
    fetchBuildLogs: PropTypes.func.isRequired,
  }),
};

SiteBuildLogs.defaultProps = {
  buildLogs: null,
  actions: {
    fetchBuildLogs: buildLogActions.fetchBuildLogs,
  },
};

const mapStateToProps = ({ buildLogs }) => ({
  buildLogs,
});

export { SiteBuildLogs };
export default connect(mapStateToProps)(SiteBuildLogs);
