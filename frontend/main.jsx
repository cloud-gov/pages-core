/* global document:true */

import 'babel-polyfill';
import { render } from 'react-dom';
import React from 'react';
import { Provider } from 'react-redux';
import { Router, browserHistory } from 'react-router';
import { syncHistoryWithStore } from 'react-router-redux';

import Glossary from 'glossary-panel';

const terms = [
  {
    term: "Federalist",
    definition: "A cool app that does some cool stuff and is cool",
  },
  {
    term: "Mammal",
    definition: 'warm blooded animal with hair or fur that gives birth to live young',
  },
  {
    term: 'Platypus',
    definition: 'A mammal that breaks all the rules',
  },
];

new Glossary(terms, {}, {
  termClass: 'glossary__term accordion__button',
});

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
