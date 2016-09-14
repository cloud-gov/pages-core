import React from 'react';

const propTypes = {
  isLoggedIn: React.PropTypes.bool
};

const getAuthEl = (loggedIn) => {
  return loggedIn ?
    <a href="/logout">Log out</a> :
    <a href="/auth/github">Log in</a>;
}

const Nav = ({ isLoggedIn }) =>
  <nav className="usa-site-navbar">
    <div className="usa-grid">
      <div className="nav-elements">
        <div className="logo" id="logo">
          <a href="/" accesskey="1" title="Home" aria-label="Home">Federalist logo</a>
        </div>
        <div className="navbar-links" id="navbar-links">
          <ul className="" id="nav-mobile">
            <li><a className="" href="https://federalist-docs.18f.gov" target="_blank">Help</a></li>
            <li><a className="" href="https://github.com/18F/federalist/issues/new" target="_blank">Contact us</a></li>
            <li>{ getAuthEl(isLoggedIn) }</li>
          </ul>
        </div>
      </div>
    </div>
  </nav>

Nav.propTypes = propTypes;

export default Nav;
