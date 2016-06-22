import React from 'react';
import { Route, Link, IndexRedirect } from 'react-router';

import App from './components/app';
import Dashboard from './components/siteList';
import SiteContainer from './components/SiteContainer';

export default (
  <Route path="/" component={App}>
    <IndexRedirect to="sites" />
    <Route path="sites" component={Dashboard}/>
    <Route path="sites/:id" component={SiteContainer}/>
  </Route>
);
