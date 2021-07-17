import React from 'react';
import PropTypes from 'prop-types';

import buildLogActions from '../../actions/buildLogActions';

class RefreshBuildLogsButton extends React.Component {
  constructor(props) {
    super(props);
    this.refreshBuildLogs = this.refreshBuildLogs.bind(this);
  }

  refreshBuildLogs() {
    const { buildId } = this.props;

    buildLogActions.fetchBuildLogs({ id: buildId });
  }

  render() {
    return (
      <button type="button" className="usa-button" onClick={this.refreshBuildLogs}>Refresh logs</button>
    );
  }
}

RefreshBuildLogsButton.propTypes = {
  buildId: PropTypes.number.isRequired,
};

export default RefreshBuildLogsButton;
