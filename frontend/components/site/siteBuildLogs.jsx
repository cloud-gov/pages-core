import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import { BUILD_LOG_DATA } from '../../propTypes';
import buildLogActions from '../../actions/buildLogActions';
import SiteBuildLogTable from './siteBuildLogTable';
import DownloadBuildLogsButton from './downloadBuildLogsButton';

export const REFRESH_INTERVAL = 15 * 1000;

let window;

class SiteBuildLogs extends React.Component {
  componentDidMount() {
    const { actions: { fetchBuildLogs }, buildId } = this.props;

    fetchBuildLogs({ id: buildId });

    this.intervalHandle = setInterval(() => {
      const windowHidden = window.document.hidden;

      if (!windowHidden) {
        fetchBuildLogs({ id: buildId });
      }
    }, REFRESH_INTERVAL);
  }

  render() {
    const { buildLogs, buildId: buildIdStr } = this.props;
    const buildId = parseInt(buildIdStr, 10);

    return (
      <div>
        <div className="log-tools">
          <ul className="usa-unstyled-list">
            <li><DownloadBuildLogsButton buildId={buildId} buildLogsData={buildLogs.data} /></li>
          </ul>
        </div>
        <SiteBuildLogTable buildLogs={buildLogs.data} />
      </div>
    );
  }
}

SiteBuildLogs.propTypes = {
  buildId: PropTypes.string.isRequired,
  buildLogs: PropTypes.shape({
    isLoading: PropTypes.bool,
    data: BUILD_LOG_DATA,
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
