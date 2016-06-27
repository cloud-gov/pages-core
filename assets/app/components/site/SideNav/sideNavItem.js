import React from 'react';
import { Link } from 'react-router';

const propTypes = {
  href: React.PropTypes.string,
  icon: React.PropTypes.string
};

const SideNavItem = ({ href, icon, linkText }) =>
  <li>
    <Link className={'icon icon-' + icon} to={href}>
      {linkText}
    </Link>
  </li>;

SideNavItem.propTypes = propTypes;

export default SideNavItem;
