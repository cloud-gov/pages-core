import React from 'react';
import PropTypes from 'prop-types';

import buildActions from '../../actions/buildActions';

function RefreshBuildsButton(props) {
  function refreshBuilds() {
    const { site } = props;
    buildActions.fetchBuilds(site);
  }

  return (
    <button type="button" className="usa-button" onClick={refreshBuilds}>Refresh builds</button>
  );
}

RefreshBuildsButton.propTypes = {
  site: PropTypes.shape({
    id: PropTypes.number,
  }).isRequired,
};

export default RefreshBuildsButton;
