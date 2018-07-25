import React from 'react';
import PropTypes from 'prop-types';
import autoBind from 'react-autobind';

import buildActions from '../../actions/buildActions';

class RefreshBuildsButton extends React.Component {
  constructor(props) {
    super(props);
    autoBind(this, 'refreshBuilds');
  }

  refreshBuilds() {
    buildActions.fetchBuilds(this.props.site);
  }

  render() {
    return (
      <button className="usa-button" onClick={this.refreshBuilds}>Refresh builds</button>
    );
  }
}

RefreshBuildsButton.propTypes = {
  site: PropTypes.shape({
    id: PropTypes.number,
  }).isRequired,
};

export default RefreshBuildsButton;
