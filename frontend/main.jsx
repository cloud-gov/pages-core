/* global document:true */

import '@babel/polyfill';
import { createRoot } from 'react-dom/client';
import React from 'react';
import { Provider } from 'react-redux';
import { Router } from 'react-router';

import routes from './routes';
import store from './store';

import './sass/styles.scss';

const mainEl = document.querySelector('#js-app');

const root = createRoot(mainEl);

root.render((
  <Provider store={store}>
    <Router>
      { routes }
    </Router>
  </Provider>
));
