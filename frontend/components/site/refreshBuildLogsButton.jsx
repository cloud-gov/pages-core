import React from 'react';
import PropTypes from 'prop-types';
import autoBind from 'react-autobind';

import buildLogActions from '../../actions/buildLogActions';

class RefreshBuildLogsButton extends React.Component {
  constructor(props) {
    super(props);
    autoBind(this, 'refreshBuildLogs');
  }

  refreshBuildLogs() {
    buildLogActions.fetchBuildLogs({ id: this.props.buildId });
  }

  render() {
    return (
      <button className="usa-button" onClick={this.refreshBuildLogs}>Refresh logs</button>
    );
  }
}

RefreshBuildLogsButton.propTypes = {
  buildId: PropTypes.number.isRequired,
};

export default RefreshBuildLogsButton;
