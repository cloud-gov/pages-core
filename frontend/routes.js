import React from 'react';
import { Route, IndexRedirect, IndexRoute, Redirect } from 'react-router';

import App from './components/app';
import SiteList from './components/siteList/siteList';
import SiteContainer from './components/siteContainer';
import SiteBuilds from './components/site/siteBuilds';
import SiteBuildLogs from './components/site/siteBuildLogs';
import SiteUsers from './components/site/SiteUsers';
import SitePublishedBranchesTable from './components/site/sitePublishedBranchesTable';
import SitePublishedFilesTable from './components/site/SitePublishedFilesTable';
import SiteGitHubBranches from './components/site/SiteGitHubBranches';
import SiteSettings from './components/site/SiteSettings';
import AddSite from './components/AddSite';
import NotFound from './components/NotFound';
import NotificationSettings from './components/site/NotificationSettings';

import siteActions from './actions/siteActions';
import userActions from './actions/userActions';

const fetchInitialData = () => {
  userActions.fetchUser();
  siteActions.fetchSites();
};

export default (
  <Route path="/" component={App} onEnter={fetchInitialData}>
    <Route path="sites">
      <IndexRoute component={SiteList} />
      <Route path="new" component={AddSite} />
      <Route path=":id" component={SiteContainer}>
        <IndexRedirect to="builds" />
        <Route path="settings" component={SiteSettings} />
        <Route path="published">
          <IndexRoute component={SitePublishedBranchesTable} />
          <Route path=":name" component={SitePublishedFilesTable} />
        </Route>
        <Route path="builds">
          <IndexRoute component={SiteBuilds} />
          <Route path=":buildId/logs" component={SiteBuildLogs} />
        </Route>
        <Route path="users" component={SiteUsers} />
        <Route path="branches" component={SiteGitHubBranches} />
        <Route path="notifications" component={NotificationSettings} />
      </Route>
      <Redirect from="*" to="/not-found" />
    </Route>
    <Route path="/not-found" component={NotFound} />
    <Redirect from="*" to="/sites" />
  </Route>
);
