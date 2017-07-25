import React from 'react';
import { Route, IndexRedirect, IndexRoute, Redirect } from 'react-router';

import App from './components/app';
import SiteList from './components/siteList/siteList';
import SiteContainer from './components/siteContainer';
import SiteBuilds from './components/site/siteBuilds';
import SiteBuildLogs from './components/site/siteBuildLogs';
import SitePublishedBranchesTable from './components/site/sitePublishedBranchesTable';
import SitePublishedFilesTable from './components/site/sitePublishedFilesTable';
import SiteSettings from './components/site/siteSettings';
import NewSite from './components/AddSite';
import NotFound from './components/NotFound';
import Home from './components/home';

export default (
  <Route path="/" component={App}>
    <IndexRoute component={Home} />
    <Route path="sites">
      <IndexRoute component={SiteList} />
      <Route path="new" component={NewSite} />
      <Route path=":id" component={SiteContainer}>
        <IndexRedirect to="settings" />
        <Route path="settings" component={SiteSettings} />
        <Route path="published">
          <IndexRoute component={SitePublishedBranchesTable} />
          <Route path=":name" component={SitePublishedFilesTable} />
        </Route>
        <Route path="builds">
          <IndexRoute component={SiteBuilds} />
          <Route path=":buildId/logs" component={SiteBuildLogs} />
        </Route>
      </Route>
      <Redirect from="*" to="/not-found" />
    </Route>
    <Route path="/not-found" component={NotFound} />
    <Redirect from="*" to="/sites" />
  </Route>
);
