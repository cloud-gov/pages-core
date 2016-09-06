import React from 'react';

const Disclaimer = () =>
  <div className="usa-disclaimer">
    <div className="usa-grid">
      <span className="usa-disclaimer-official">
        <img className="usa-flag_icon" alt="US flag signifying that this is a United States Federal Government website" src="/images/uswds/us_flag_small.png" />
        An official website of the United States Government
      </span>
      <span className="usa-disclaimer-stage">This site is currently in beta. <a href="https://18f.gsa.gov/dashboard/stages/#beta">Learn more.</a></span>
    </div>
  </div>;

export default Disclaimer;
