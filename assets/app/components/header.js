import React from 'react';

import Disclaimer from './disclaimer';
import Nav from './nav';

const propTypes = {
  username: React.PropTypes.oneOfType([
    React.PropTypes.string,
    React.PropTypes.object
  ])
};

const Header = ({ username = null }) =>
  <header className="usa-site-header" role="banner">
    <Disclaimer />
    <Nav username={ username } />
  </header>

Header.propTypes = propTypes;

export default Header;
