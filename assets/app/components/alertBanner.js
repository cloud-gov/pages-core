import React from 'react';

const propTypes = {
  message: React.PropTypes.string,
  status: React.PropTypes.string
};

const AlertBanner = ({message, status = 'info'}) =>
  !message ? null :
  <div className="usa-grid">
    <div className="alert-container container">
      <div
        className={`usa-alert usa-alert-${status} new-site-error`}
        role="alert"
      >
        { message }
      </div>
    </div>
  </div>;

AlertBanner.propTypes = propTypes;

export default AlertBanner;
