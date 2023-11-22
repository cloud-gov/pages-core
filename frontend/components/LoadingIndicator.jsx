import React from 'react';
import PropTypes from 'prop-types';

const LoadingIndicator = ({ text, size = 'main' }) => (
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

LoadingIndicator.defaultProps = {
  text: 'Loading...',
  size: 'main',
};

export default LoadingIndicator;
