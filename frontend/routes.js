import React from 'react';
import { Route, IndexRedirect, IndexRoute, Redirect } from 'react-router';

import App from './components/app';
import SiteList from './components/siteList/siteList';
import SiteContainer from './components/siteContainer';
import SiteBuilds from './components/site/siteBuilds';
import SiteBuildLogs from './components/site/siteBuildLogs';
import SiteUsers from './components/site/SiteUsers';
import SitePublishedBranchesTable from './components/site/sitePublishedBranchesTable';
import SitePublishedFilesTable from './components/site/sitePublishedFilesTable';
import SiteSettings from './components/site/SiteSettings';
import AdvancedSiteSettings from './components/site/AdvancedSiteSettings';
import AddSite from './components/AddSite';
import NotFound from './components/NotFound';

export default (
  <Route path="/" component={App}>
    <Route path="sites">
      <IndexRoute component={SiteList} />
      <Route path="new" component={AddSite} />
      <Route path=":id" component={SiteContainer}>
        <IndexRedirect to="settings" />
        <Route path="settings" component={SiteSettings} />
        <Route path="settings/advanced" component={AdvancedSiteSettings} />
        <Route path="published">
          <IndexRoute component={SitePublishedBranchesTable} />
          <Route path=":name" component={SitePublishedFilesTable} />
        </Route>
        <Route path="builds">
          <IndexRoute component={SiteBuilds} />
          <Route path=":buildId/logs" component={SiteBuildLogs} />
        </Route>
        <Route path="users" component={SiteUsers} />
      </Route>
      <Redirect from="*" to="/not-found" />
    </Route>
    <Route path="/not-found" component={NotFound} />
    <Redirect from="*" to="/sites" />
  </Route>
);
