import React from 'react';

const propTypes = {
  isLoggedIn: React.PropTypes.bool
};

const Nav = (props) => {
  let authEl = (props.isLoggedIn) ? <a class="" href="/logout">Log out</a>
    : <a class="" href="/auth/github">Log in</a>;

  return (
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
              <li>{ authEl }</li>
            </ul>
          </div>
        </div>
      </div>
    </nav>
  );
};

Nav.propTypes = propTypes;

export default Nav;
