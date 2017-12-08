import React from 'react';
import PropTypes from 'prop-types';

const propTypes = {
  clickHandler: PropTypes.func.isRequired,
  children: PropTypes.node,
};

/* eslint-disable jsx-a11y/href-no-hash */
const ButtonLink = ({ clickHandler, children }) =>
  <a
    href="#"
    role="button"
    onClick={clickHandler}
  >
    {children}
  </a>;
/* eslint-enable jsx-a11y/href-no-hash */

ButtonLink.propTypes = propTypes;
ButtonLink.defaultProps = {
  children: null,
};

export default ButtonLink;
