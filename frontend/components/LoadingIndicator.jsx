import React from 'react';
import PropTypes from 'prop-types';

const LoadingIndicator = ({ text = 'Loading...', size = 'main' }) => (
  <div className={`loader loader--${size}`} id="main-loader">
    <div className="uil-ring-css">
      <div />
    </div>
    <div>{text}</div>
  </div>
);

LoadingIndicator.propTypes = {
  text: PropTypes.string,
  size: PropTypes.string,
};

export default LoadingIndicator;
