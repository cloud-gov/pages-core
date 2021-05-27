import React from 'react';
import PropTypes from 'prop-types';

import buildActions from '../../actions/buildActions';

class RefreshBuildsButton extends React.Component {
  constructor(props) {
    super(props);
    this.refreshBuilds = this.refreshBuilds.bind(this);
  }

  refreshBuilds() {
    const { site } = this.props;
    buildActions.fetchBuilds(site);
  }

  render() {
    return (
      <button type="button" className="usa-button" onClick={this.refreshBuilds}>Refresh builds</button>
    );
  }
}

RefreshBuildsButton.propTypes = {
  site: PropTypes.shape({
    id: PropTypes.number,
  }).isRequired,
};

export default RefreshBuildsButton;
