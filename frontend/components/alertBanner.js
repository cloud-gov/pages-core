import React from 'react';

const propTypes = {
  message: React.PropTypes.string,
  status: React.PropTypes.string,
};

const defaultProps = {
  message: null,
  status: null,
};

const AlertBanner = ({ message, status = 'info' }) => {
  if (!message) {
    return null;
  }

  return (
    <div className="usa-grid">
      <div className="alert-container container">
        <div
          className={`usa-alert usa-alert-${status}`}
          role="alert"
        >
          <div className="usa-alert-body">
            <div className="usa-alert-heading">
              <h3>Heading</h3>
            </div>
            <p className="usa-alert-text">
              { message }
            </p>
          </div>
        </div>
      </div>
    </div>);
};

AlertBanner.propTypes = propTypes;
AlertBanner.defaultProps = defaultProps;

export default AlertBanner;
