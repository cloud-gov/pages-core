import React from 'react';

const propTypes = {
  className: React.PropTypes.string,
  text: React.PropTypes.string,
  href: React.PropTypes.string
}

const LinkButton = ({className, text, href}) =>
  <a href={href} className={className}>
    {text}
  </a>;

LinkButton.propTypes = propTypes;

export default LinkButton;
