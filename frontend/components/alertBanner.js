import React from 'react';
import PropTypes from 'prop-types';

const propTypes = {
  message: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  status: PropTypes.string,
  header: PropTypes.string,
  children: PropTypes.node,
};

const defaultProps = {
  message: null,
  status: 'info',
  children: null,
};

const renderHeader = (text) => {
  if (!text) {
    return null;
  }

  return (
    <h3 className="usa-alert-heading">
      { text }
    </h3>
  );
};

const AlertBanner = ({ children, header, message, status }) => {
  if (!message) {
    return null;
  }

  return (
    <div
      className={`usa-alert usa-alert-${status}`}
      role="alert"
    >
      <div className="usa-alert-body">
        { renderHeader(header) }
        <p className="usa-alert-text">
          { message }
        </p>
        { children }
      </div>
    </div>
  );
};

AlertBanner.propTypes = propTypes;
AlertBanner.defaultProps = defaultProps;

export default AlertBanner;
