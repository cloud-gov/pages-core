import React from 'react';

const loading = (Component) => {
  const loadingWrapper = (props) => {
    const { site: { loading } } = props;

    if (typeof loading === 'undefined' || loading) {
      return (
        <div className="main-loader" id="main-loader">
          <div className='uil-ring-css' style={{transform: 'scale(0.6)'}}>
            <div></div>
          </div>
          <div>Loading...</div>
        </div>
      );
    }

    return <Component {...props} />;
  };

  return loadingWrapper;
};

export default loading;
