import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import buildLogActions from '../../actions/buildLogActions';
import LoadingIndicator from '../LoadingIndicator';
import SiteBuildLogTable from './siteBuildLogTable';
import RefreshBuildLogsButton from './refreshBuildLogsButton';
import DownloadBuildLogsButton from './downloadBuildLogsButton';

class SiteBuildLogs extends React.Component {
  componentDidMount() {
    buildLogActions.fetchBuildLogs({ id: this.props.params.buildId });
  }

  render() {
    const { buildLogs } = this.props;
    const buildId = parseInt(this.props.params.buildId, 10);

    if (buildLogs.isLoading) {
      return <LoadingIndicator />;
    }

    if (!buildLogs || !buildLogs.data || !buildLogs.data.length) {
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
            <li><RefreshBuildLogsButton buildId={buildId} /></li>
          </ul>
        </div>
        <SiteBuildLogTable buildLogs={buildLogs.data} />
      </div>
    );
  }
}

SiteBuildLogs.propTypes = {
  params: PropTypes.shape({
    buildId: PropTypes.string.isRequired,
  }).isRequired,
  buildLogs: PropTypes.shape({
    isLoading: PropTypes.bool,
    data: PropTypes.array,
  }),
};

SiteBuildLogs.defaultProps = {
  buildLogs: null,
};

const mapStateToProps = ({ buildLogs }) => ({
  buildLogs,
});

export { SiteBuildLogs };
export default connect(mapStateToProps)(SiteBuildLogs);
