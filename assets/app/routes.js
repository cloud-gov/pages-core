import React from 'react';
import { Route, Link, IndexRedirect, IndexRoute, Redirect } from 'react-router';

import App from './components/app';
import Dashboard from './components/Dashboard/siteList';
import SiteContainer from './components/siteContainer';
import SitePagesContainer from './components/site/Pages/pagesContainer';
import SiteEditorContainer from './components/site/editor/editorContainer';
import SiteLogs from './components/site/siteLogs';
import SiteMediaContainer from './components/site/siteMediaContainer';
import SiteSettings from './components/site/siteSettings';
import NewSite from './components/AddSite';
import NotFound from './components/NotFound';


export default (
  <Route path="/" component={App}>
    <IndexRedirect to="sites"/>
    <Route path="sites">
      <IndexRoute component={Dashboard}/>
      <Route path="new" component={NewSite} />
      <Route path=":id" component={SiteContainer}>
        <IndexRedirect to="tree" />
        <Route path="tree" component={SitePagesContainer}>
          <Route path=":fileName" component={SitePagesContainer} />
        </Route>
        <Route path="new/:branch(/:fileName)" component={SiteEditorContainer} isNewPage={true} />
        <Route path="edit/:branch/:fileName" component={SiteEditorContainer}/>
        <Route path="media" component={SiteMediaContainer}/>
        <Route path="settings" component={SiteSettings}/>
        <Route path="logs" component={SiteLogs}/>
      </Route>
      <Redirect from="*" to="/not-found"/>
    </Route>
    <Route path="/not-found" component={NotFound}/>
    <Redirect from="*" to="/sites"/>
  </Route>
);
