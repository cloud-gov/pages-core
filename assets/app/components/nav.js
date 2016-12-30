import React from 'react';
import { Link } from 'react-router';

const propTypes = {
  isLoggedIn: React.PropTypes.bool,
  username: React.PropTypes.oneOfType([
    React.PropTypes.string,
    React.PropTypes.object
  ])
};

const getSecondaryNav = (loggedIn, username) => {
  const authLinks = [
    <Link to="/sites">{username}</Link>,
    <a href="https://federalist-docs.18f.gov" target="_blank">Documentation</a>,
    <a href="https://github.com/18F/federalist/issues/new" target="_blank">Contact us</a>
    <a href="/logout">Log out</a>
  ];
  const unAuthLinks = [
    <a href="/auth/github">Log in</a>,
    <a href="https://federalist-docs.18f.gov" target="_blank">Help</a>,
    <a href="https://github.com/18F/federalist/issues/new" target="_blank">Contact us</a>
  ];

  return (loggedIn ? authLinks : unAuthLinks).map((link, index) => {
    return <li key={index}>{link}</li>;
  });
};

const Nav = ({ isLoggedIn, username = null }) =>
  <nav className="usa-site-navbar">
    <div className="usa-grid">
      <div className="nav-elements">
        <div className="logo" id="logo">
          <a href="/" accessKey="1" title="Home" aria-label="Home">Federalist logo</a>
        </div>
        <div className="navbar-links" id="navbar-links">
          <ul className="" id="nav-mobile">
            {getSecondaryNav(isLoggedIn, username)}
          </ul>
        </div>
      </div>
    </div>
  </nav>

Nav.propTypes = propTypes;

export default Nav;
