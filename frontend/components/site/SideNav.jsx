import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router';

const SideNav = ({ siteId }) => (
  <div className="usa-width-one-sixth">
    <ul className="side-nav">
      <li>
        <Link to={`/sites/${siteId}/settings`} className="icon icon-settings">
          Settings
        </Link>
      </li>
      <li>
        <Link to={`/sites/${siteId}/users`} className="icon icon-gear">
          Users
        </Link>
      </li>
      {/* TODO: this should be table of branches with preview links */}
      <li>
        <Link to="#" className="icon icon-pages">
          GitHub Branches
        </Link>
      </li>
      <li>
        <Link to={`/sites/${siteId}/published`} className="icon icon-upload">
          Data on S3
        </Link>
      </li>
      <li>
        <Link to={`/sites/${siteId}/builds`} className="icon icon-logs">
          Build History
        </Link>
      </li>
    </ul>
  </div>
);

SideNav.propTypes = {
  siteId: PropTypes.number.isRequired,
};

export default SideNav;
