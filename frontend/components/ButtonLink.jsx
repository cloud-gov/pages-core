import React from 'react';
import PropTypes from 'prop-types';

const ButtonLink = ({ clickHandler, children }) => (
  <button
    type="button"
    onClick={clickHandler}
    className="usa-button usa-button-secondary"
  >
    {children}
  </button>
);

ButtonLink.propTypes = {
  clickHandler: PropTypes.func.isRequired,
  children: PropTypes.node,
};

ButtonLink.defaultProps = {
  children: null,
};

export default ButtonLink;
