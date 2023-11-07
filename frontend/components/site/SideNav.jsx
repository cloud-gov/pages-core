import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

import * as icons from '../icons';

const SideNav = ({ config, siteId }) => (
  <div className="usa-width-one-sixth side-nav" role="navigation">
    <ul className="usa-sidenav-list">
      {
        config.map((conf) => {
          const IconComponent = icons[conf.icon];
          return (
            <li key={conf.route}>
              <Link to={`/sites/${siteId}/${conf.route}`}>
                <IconComponent />
                {' '}
                {conf.display}
              </Link>
            </li>
          );
        })
      }
    </ul>
  </div>
);

SideNav.propTypes = {
  config: PropTypes.arrayOf(PropTypes.shape({
    display: PropTypes.string.isRequired,
    route: PropTypes.string.isRequired,
    icon: PropTypes.string.isRequired,
  })).isRequired,
  siteId: PropTypes.number.isRequired,
};

export default SideNav;
