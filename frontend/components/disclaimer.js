import React from 'react';

const flagUrl = require('uswds/dist/img/us_flag_small.png');

const Disclaimer = () =>
  <div className="usa-disclaimer">
    <div className="usa-grid">
      <span className="usa-disclaimer-official">
        <img
          className="usa-flag_icon"
          alt="US flag signifying that this is a United States Federal Government website"
          src={flagUrl}
        />
        An official website of the United States Government
      </span>
    </div>
  </div>;

export default Disclaimer;
