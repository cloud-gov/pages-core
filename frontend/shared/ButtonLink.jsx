import React from 'react';
import PropTypes from 'prop-types';

const ButtonLink = ({ clickHandler, children, className = 'usa-button--outline' }) => (
  <button type="button" onClick={clickHandler} className={`usa-button ${className}`}>
    {children}
  </button>
);

ButtonLink.propTypes = {
  clickHandler: PropTypes.func.isRequired,
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

export default ButtonLink;
