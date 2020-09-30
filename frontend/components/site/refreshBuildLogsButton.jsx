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
