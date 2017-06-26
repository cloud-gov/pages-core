import React from 'react';
import PropTypes from 'prop-types';

import buildLogActions from '../../actions/buildLogActions';
import LoadingIndicator from '../loadingIndicator';
import SiteBuildLogTable from './siteBuildLogTable';
import { API } from '../../util/federalistApi';


class SiteBuildLogs extends React.Component {
  componentDidMount() {
    buildLogActions.fetchBuildLogs({ id: this.props.params.buildId });
  }

  render() {
    const { buildLogs } = this.props;

    if (buildLogs.isLoading) {
      return <LoadingIndicator />;
    }

    // else
    if (!buildLogs.data || !buildLogs.data.length) {
      return (<p>This build does not have any build logs.</p>);
    }

    // else
    const buildId = this.props.params.buildId;
    const downloadUrl = `${API}/build/${buildId}/log?format=text`;
    const downloadName = `build-log-${buildId}.txt`;

    return (
      <div>
        <a href={downloadUrl} download={downloadName}>Download logs</a>
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

export default SiteBuildLogs;
