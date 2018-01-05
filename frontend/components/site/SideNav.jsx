import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router';

const SideNav = ({ siteId }) => (
  <div className="usa-width-one-sixth">
    <ul className="side-nav">
      <li>
        <Link to={`/sites/${siteId}/builds`} className="icon icon-logs">
          Build history
        </Link>
      </li>
      <li>
        <Link to={`/sites/${siteId}/branches`} className="icon icon-pages">
          GitHub branches
        </Link>
      </li>
      <li>
        <Link to={`/sites/${siteId}/published`} className="icon icon-upload">
          Published files
        </Link>
      </li>
      <li>
        <Link to={`/sites/${siteId}/users`} className="icon icon-gear">
          Collaborators
        </Link>
      </li>
      <li>
        <Link to={`/sites/${siteId}/settings`} className="icon icon-settings">
          Site settings
        </Link>
      </li>
    </ul>
  </div>
);

SideNav.propTypes = {
  siteId: PropTypes.number.isRequired,
};

export default SideNav;
