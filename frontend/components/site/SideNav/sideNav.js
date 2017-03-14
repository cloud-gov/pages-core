import React from 'react';
import SideNavItem from './sideNavItem';

const propTypes = {
  siteId: React.PropTypes.string
};

export const sideNavPaths = {
  SETTINGS: 'settings',
  BUILDS: 'builds',
  PUBLISHED: 'published',
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
            href={this.getUrl(siteId, sideNavPaths.PUBLISHED)}
            icon='media'
            linkText={sideNavPaths.PUBLISHED}
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
