import React from 'react';
import { Route, Link, IndexRedirect, IndexRoute, Redirect } from 'react-router';

import App from './components/app';
import Dashboard from './components/Dashboard/siteList';
import SiteContainer from './components/siteContainer';
import SitePagesContainer from './components/site/Pages/pagesContainer';
import SiteLogs from './components/site/siteLogs';
import SiteMediaContainer from './components/site/siteMediaContainer';
import SiteSettings from './components/site/siteSettings';
import NotFound from './components/NotFound';

const Stub = () =>
  <div>hi</div>;

export default (
  <Route path="/" component={App}>
    <IndexRedirect to="sites"/>
    <Route path="sites">
      <IndexRoute component={Dashboard}/>
      <Route path=":id" component={SiteContainer}>
        <IndexRoute component={SitePagesContainer}/>
        <Route path="tree/:fileName" component={SitePagesContainer}/>
        <Route path="settings" component={SiteSettings}/>
        <Route path="media" component={SiteMediaContainer}/>
        <Route path="logs" component={SiteLogs}/>
        <Route path="edit/:branch/:fileName" component={Stub}/>
      </Route>
      <Redirect from="*" to="/not-found"/>
    </Route>
    <Route path="/not-found" component={NotFound}/>
    <Redirect from="*" to="/sites"/>
  </Route>
);
