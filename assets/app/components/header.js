
import React from 'react';

import Disclaimer from './disclaimer';
import Nav from './nav';

class Header extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <header className="usa-site-header" role="banner">
        <Disclaimer />
        <Nav isLoggedIn={ this.props.isLoggedIn } />
      </header>
    )
  }
}

Header.defaultProps = {
  isLoggedIn: false
};

Header.propTypes = {
  isLoggedIn: React.PropTypes.bool
};

export default Header;
