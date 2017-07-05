import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router';

const propTypes = {
  alt: PropTypes.string,
  children: PropTypes.oneOfType([
    PropTypes.object,
    PropTypes.array,
  ]),
  className: PropTypes.string,
  href: PropTypes.string.isRequired,
  target: PropTypes.string,
  text: PropTypes.string,
};

const defaultProps = {
  text: null,
  children: null,
  alt: null,
  className: null,
  target: null,
};

const LinkButton = ({ target, href, className, alt, text, children }) => {
  const rel = target && target.toLowerCase() === '_blank' ? 'noopener noreferrer' : null;

  return (
    <Link
      role="button"
      to={href}
      className={`usa-button ${className}`}
      alt={alt}
      target={target}
      rel={rel}
    >
      {text || children}
    </Link>);
};


LinkButton.propTypes = propTypes;
LinkButton.defaultProps = defaultProps;

export default LinkButton;
