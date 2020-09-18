import React from 'react';
import PropTypes from 'prop-types';

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

const genericErrorMsg = (
  <span>
    We are experiencing an unexpected problem, please wait a few moments and try the following:
    <ol>
      <li>refresh the page</li>
      <li>log out and back in to your account</li>
    </ol>
    If this error persists, please contact us, we apologize for the inconvenience.
  </span>
);

const cloudDotGovErrorRegex = /^404 Not Found: Requested route \('.*'\) does not exist./;

const AlertBanner = ({
  children, header, message, status, alertRole,
}) => {
  if (!message) {
    return null;
  }

  const msg = cloudDotGovErrorRegex.test(message) ? genericErrorMsg : message;

  return (
    <div
      className={`usa-alert usa-alert-${status}`}
      role={alertRole ? 'alert' : undefined}
    >
      <div className="usa-alert-body">
        { renderHeader(header) }
        <p className="usa-alert-text">
          { msg }
        </p>
        { children }
      </div>
    </div>
  );
};

AlertBanner.propTypes = {
  message: PropTypes.node,
  status: PropTypes.string,
  header: PropTypes.string,
  children: PropTypes.node,
  /**
   * role="alert" is a flag which will tell a user's assistive device to notify the user
   * that there is important information to be communicated. The majority of our alerts are
   * used to inform the user of form errors or missing information.
   *
   * However, there are some places where the AlertBanner component is used to display information
   * that is not critical to the user (such as the site delete action under AdvancedSettings).
   * For these cases, this flag is added to opt out of adding `role="alert"` where desired.
   *
   * See https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/ARIA_Techniques/Using_the_alert_role
   */

  alertRole: PropTypes.bool,
};

AlertBanner.defaultProps = {
  message: null,
  status: 'info',
  children: null,
  alertRole: true,
  header: null,
};

export default AlertBanner;
