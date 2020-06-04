import React from 'react';
import PropTypes from 'prop-types';

const ButtonLink = ({ clickHandler, children }) => (
  <a
    href="#"
    role="button"
    onClick={clickHandler}
  >
    {children}
  </a>
);

ButtonLink.propTypes = {
  clickHandler: PropTypes.func.isRequired,
  children: PropTypes.node,
};

ButtonLink.defaultProps = {
  children: null,
};

export default ButtonLink;
