import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router';

import * as icons from '../icons';
import { SITE_NAVIGATION_CONFIG } from '../siteContainer';

const SideNav = ({ siteId }) => (
  <div className="usa-width-one-sixth side-nav">
    <ul className="usa-sidenav-list">
      {
        SITE_NAVIGATION_CONFIG.map((conf) => {
          const IconComponent = icons[conf.icon];
          return (
            <li key={conf.route}>
              <Link to={`/sites/${siteId}/${conf.route}`}>
                <IconComponent /> {conf.display}
              </Link>
            </li>
          );
        })
      }
    </ul>
  </div>
);

SideNav.propTypes = {
  siteId: PropTypes.number.isRequired,
};

export default SideNav;
