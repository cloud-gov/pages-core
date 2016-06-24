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
      <ul className="site-actions">
        <SideNavItem
          href={this.getUrl(siteId)}
          linkText={sideNavPaths.PAGES}
        />
        <SideNavItem
          href={this.getUrl(siteId, sideNavPaths.MEDIA)}
          linkText={sideNavPaths.MEDIA}
        />
        <SideNavItem
          href={this.getUrl(siteId, sideNavPaths.SETTINGS)}
          linkText={sideNavPaths.SETTINGS}
        />
        <SideNavItem
          href={this.getUrl(siteId, sideNavPaths.LOGS)}
          linkText={sideNavPaths.LOGS}
        />
      </ul>
    );
  }
}

export default SideNav;
