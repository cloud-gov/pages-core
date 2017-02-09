import React from 'react';
import { sideNavPaths } from '../../../constants';
import SideNavItem from './sideNavItem';

const propTypes = {
  siteId: React.PropTypes.string
};

class SideNav extends React.Component {
  getUrl(id, path='') {
    // strip trailing slashes, just in case.
    return `/sites/${id}/${path}`.replace(/\/$/, '');
  }

  render() {
    const { siteId } = this.props;

    return (
      <div className="usa-width-one-sixth" id="fool">
        <ul className="site-actions">
          <SideNavItem
            href={this.getUrl(siteId, sideNavPaths.SETTINGS)}
            icon='settings'
            linkText={sideNavPaths.SETTINGS}
          />
          <SideNavItem
            href={this.getUrl(siteId, sideNavPaths.BUILDS)}
            icon='logs'
            linkText={sideNavPaths.BUILDS}
          />
        </ul>
      </div>
    );
  }
}

export default SideNav;
