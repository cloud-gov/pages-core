/* global document:true */

import 'babel-polyfill';
import { render } from 'react-dom';
import React from 'react';
import { Router, browserHistory } from 'react-router';
import { Provider } from 'react-redux';

import siteActions from './actions/siteActions';
import userActions from './actions/userActions';

import routes from './routes';
import store from './store';

import CustomProvider from './util/provider';  // TODO: Phase this out

require('./sass/styles.scss');

const mainEl = document.querySelector('#js-app');

store.subscribe(() => {
  render((
    <Provider store={store}>
      <CustomProvider state={{ get: store.getState }}>
        <Router history={browserHistory}>
          {routes}
        </Router>
      </CustomProvider>
    </Provider>
  ), mainEl);
});


userActions.fetchUser();
siteActions.fetchSites();
