/* global document:true */

import 'babel-polyfill';
import { render } from 'react-dom';
import React from 'react';
import { Provider } from 'react-redux';
import { Router, browserHistory } from 'react-router';
import { syncHistoryWithStore } from 'react-router-redux';

import siteActions from './actions/siteActions';
import userActions from './actions/userActions';

import routes from './routes';
import store from './store';

import './sass/styles.scss';

const history = syncHistoryWithStore(browserHistory, store);

const mainEl = document.querySelector('#js-app');

render((
  <Provider store={store}>
    <Router history={history}>
      { routes }
    </Router>
  </Provider>
), mainEl);

userActions.fetchUser();
siteActions.fetchSites();
