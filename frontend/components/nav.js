import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router';
import shortid from 'shortid';

const propTypes = {
  username: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.object,
  ]),
};

const defaultProps = {
  username: null,
};

function getSecondaryNavLinks(username) {
  if (username) {
    return [
      <Link to="/sites">{username}</Link>,
      <a href="https://federalist-docs.18f.gov" target="_blank" rel="noopener noreferrer">Documentation</a>,
      <a href="https://github.com/18F/federalist/issues/new" target="_blank" rel="noopener noreferrer">File Issue</a>,
      <a href="mailto:federalist-support@gsa.gov">Get Help</a>,
      <a href="/logout">Log out</a>,
    ];
  }
  return [
    <a href="https://federalist-docs.18f.gov" target="_blank" rel="noopener noreferrer">Documentation</a>,
    <a href="https://github.com/18F/federalist/issues/new" target="_blank" rel="noopener noreferrer">Contact Us</a>,
    <a href="/auth/github">Log in</a>,
  ];
}

function getSecondaryNav(username) {
  const links = getSecondaryNavLinks(username);
  return links.map(link => <li key={shortid.generate()}>{link}</li>);
}


const Nav = ({ username = null }) =>
  <nav className="usa-site-navbar">
    <div className="usa-grid">
      <div className="nav-elements">
        <div className="logo" id="logo">
          <a href="/" title="Home" aria-label="Home">Federalist logo</a>
        </div>
        <div className="navbar-links" id="navbar-links">
          <ul className="" id="nav-mobile">
            {getSecondaryNav(username)}
          </ul>
        </div>
      </div>
    </div>
  </nav>;

Nav.propTypes = propTypes;
Nav.defaultProps = defaultProps;

export default Nav;
