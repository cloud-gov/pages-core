import React from 'react';

const LoadingIndicator = () => (
  <div className="main-loader" id="main-loader">
    <div className="uil-ring-css" style={{ transform: 'scale(0.6)' }}>
      <div />
    </div>
    <div>Loading...</div>
  </div>
);

export default LoadingIndicator;
