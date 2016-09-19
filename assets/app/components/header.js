import React from 'react';

import Disclaimer from './disclaimer';
import Nav from './nav';

const propTypes = {
  isLoggedIn: React.PropTypes.bool,
  username: React.PropTypes.oneOfType([
    React.PropTypes.string,
    React.PropTypes.object
  ])
};

const Header = ({ isLoggedIn = false, username = null }) =>
  <header className="usa-site-header" role="banner">
    <Disclaimer />
    <Nav isLoggedIn={ isLoggedIn } username={ username } />
  </header>

Header.propTypes = propTypes;
Header.defaultProps = {
  isLoggedIn: false
};

export default Header;
