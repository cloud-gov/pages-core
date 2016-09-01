import React from 'react';

import Disclaimer from './disclaimer';
import Nav from './nav';

const propTypes = {
  isLoggedIn: React.PropTypes.bool
};

const Header = ({ isLoggedIn = false }) =>
  <header className="usa-site-header" role="banner">
    <Disclaimer />
    <Nav isLoggedIn={ isLoggedIn } />
  </header>

Header.propTypes = propTypes;
Header.defaultProps = {
  isLoggedIn: false
};

export default Header;
