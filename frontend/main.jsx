/* global document:true */

import 'babel-polyfill';
import { render } from 'react-dom';
import React from 'react';
import { Provider } from 'react-redux';
import { Router } from '@reach/router';


import routes from './routes';
import store from './store';

import './sass/styles.scss';

const mainEl = document.querySelector('#js-app');

render((
  <Provider store={store}>
    <Router>
      { routes }
    </Router>
  </Provider>
), mainEl);
