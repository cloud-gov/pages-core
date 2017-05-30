import PropTypes from 'prop-types';
import React from 'react';
import { Link } from 'react-router';

const propTypes = {
  alt: PropTypes.string,
  children: PropTypes.oneOfType([
    PropTypes.object,
    PropTypes.array
  ]),
  className: PropTypes.string,
  href: PropTypes.string,
  target: PropTypes.string,
  text: PropTypes.string
}

const LinkButton = ({ className, children, text, href, alt, target }) =>
  <Link role="button"
    to={href}
    className={`usa-button ${className}`}
    alt={alt}
    target={target}
  >{text || children}</Link>;

LinkButton.propTypes = propTypes;

export default LinkButton;
