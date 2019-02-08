import React from 'react';
import PropTypes from 'prop-types';
import autoBind from 'react-autobind';
import { connect } from 'react-redux';

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
    autoBind(this, 'toggleAutoRefresh');
  }

  /* eslint-disable scanjs-rules/call_setInterval */
  componentDidMount() {
    const { fetchBuildLogs } = this.props.actions;
    fetchBuildLogs({ id: this.props.params.buildId });
    this.intervalHandle = setInterval(() => {
      if (this.state.autoRefresh) {
        fetchBuildLogs({ id: this.props.params.buildId });
      }
    }, REFRESH_INTERVAL);
  }
  /* eslint-enable scanjs-rules/call_setInterval */

  toggleAutoRefresh() {
    this.setState(state => ({ autoRefresh: !state.autoRefresh }));
  }

  /* eslint-disable jsx-a11y/href-no-hash */
  render() {
    const { buildLogs } = this.props;
    const { autoRefresh } = this.state;
    const buildId = parseInt(this.props.params.buildId, 10);

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
                <a
                  href="#"
                  role="button"
                  onClick={this.toggleAutoRefresh}
                  data-test="toggle-auto-refresh"
                >
                  Auto Refresh: <b>{autoRefresh ? 'ON' : 'OFF'}</b>
                </a>
              </div>
              <RefreshBuildLogsButton buildId={buildId} />
            </li>
          </ul>
        </div>
        { buildLogs.isLoading ?
          <LoadingIndicator /> :
          <SiteBuildLogTable buildLogs={buildLogs.data} />
        }
      </div>
    );
  }
}
/* eslint-enable jsx-a11y/href-no-hash */

SiteBuildLogs.propTypes = {
  params: PropTypes.shape({
    buildId: PropTypes.string.isRequired,
  }).isRequired,
  buildLogs: PropTypes.shape({
    isLoading: PropTypes.bool,
    data: PropTypes.array,
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
