import React from 'react';
import PropTypes from 'prop-types';

const LoadingIndicator = ({ text }) => (
  <div className="main-loader" id="main-loader">
    <div className="uil-ring-css" style={{ transform: 'scale(0.6)' }}>
      <div />
    </div>
    <div>{text}</div>
  </div>
);

LoadingIndicator.propTypes = {
  text: PropTypes.string,
};

LoadingIndicator.defaultProps = {
  text: 'Loading...',
};

export default LoadingIndicator;
