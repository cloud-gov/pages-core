import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

import * as icons from '../icons';

const SideNav = ({ config, siteId }) => (
  <div className="tablet:grid-col-3 desktop:grid-col-2  grid-col-12 side-nav margin-top-neg-2 padding-y-2 tablet:padding-y-4 bg-primary-lightest" role="navigation">
    <ul className="usa-sidenav-list usa-list--unstyled">
      {
        config.map((conf) => {
          const IconComponent = icons[conf.icon];
          return (
            <li className="margin-y-2" key={conf.route}>
              <Link className="display-flex flex-align-center" to={`/sites/${siteId}/${conf.route}`}>
                <IconComponent />
                {' '}
                <span className="flex-fill margin-left-1 text-no-underline">
                  {conf.display}
                </span>
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
