import React from 'react';

const propTypes = {
  className: React.PropTypes.string,
  text: React.PropTypes.string,
  href: React.PropTypes.string
}

// TODO: ...props should work in this fn call, figure out why it doesn't
const LinkButton = ({ className, text, href, alt, target }) =>
  <a role="button"
    href={href}
    className={`usa-button ${className}`}
    alt={alt}
    target={target}
  >{text}</a>;

LinkButton.propTypes = propTypes;

export default LinkButton;
