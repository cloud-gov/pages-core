import React from 'react';
import PropTypes from 'prop-types';

import SideNav from './site/SideNav/sideNav';
import PagesHeader from './site/pagesHeader';
import AlertBanner from './alertBanner';

const propTypes = {
  params: PropTypes.shape({
    id: PropTypes.string,
    branch: PropTypes.string,
    fileName: PropTypes.string,
  }).isRequired,
  storeState: PropTypes.shape({
    sites: PropTypes.object,
    builds: PropTypes.object,
    buildLogs: PropTypes.object,
    publishedBranches: PropTypes.object,
    publishedFiles: PropTypes.object,
    githubBranches: PropTypes.object,
    alert: PropTypes.shape({
      message: PropTypes.string,
      status: PropTypes.string,
    }),
  }),
  location: PropTypes.shape({
    pathname: PropTypes.string,
  }),
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node,
  ]),
};

const defaultProps = {
  children: null,
  location: null,
  storeState: null,
};

class SiteContainer extends React.Component {
  getPageTitle(pathname) {
    return pathname.split('/').pop();
  }

  getCurrentSite(sitesState, siteId) {
    if (sitesState.isLoading) {
      return null;
    }

    return sitesState.data.find(site => site.id === parseInt(siteId, 10));
  }

  render() {
    const { storeState, children, params, location } = this.props;

    const site = this.getCurrentSite(storeState.sites, params.id);
    const builds = storeState.builds;
    const buildLogs = storeState.buildLogs;
    const publishedBranches = storeState.publishedBranches;
    const publishedFiles = storeState.publishedFiles;
    const githubBranches = storeState.githubBranches;
    const childConfigs = {
      site,
      builds,
      buildLogs,
      publishedBranches,
      publishedFiles,
      githubBranches,
    };

    const pageTitle = this.getPageTitle(location.pathname);

    if (!site) {
      return null;
    }

    return (
      <div className="usa-grid site">
        <SideNav siteId={site.id} />
        <div className="usa-width-five-sixths site-main" id="pages-container">
          <AlertBanner
            message={storeState.alert.message}
            status={storeState.alert.status}
          />
          <PagesHeader
            repository={site.repository}
            owner={site.owner}
            title={pageTitle}
            siteId={site.id}
            branch={params.branch || site.defaultBranch}
            fileName={params.fileName}
            viewLink={site.viewLink}
          />
          <div className="usa-grid">
            {children &&
              React.cloneElement(children, childConfigs)
            }
          </div>
        </div>
      </div>
    );
  }
}

SiteContainer.propTypes = propTypes;
SiteContainer.defaultProps = defaultProps;

export default SiteContainer;
