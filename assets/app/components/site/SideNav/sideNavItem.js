import React from 'react';
import { Link } from 'react-router';

const propTypes = {
  href: React.PropTypes.string
};

const SideNavItem = ({ href, linkText }) =>
  <li>
    <Link className="icon icon-media" to={href}>
      {linkText}
    </Link>
  </li>;

SideNavItem.propTypes = propTypes;

export default SideNavItem;
