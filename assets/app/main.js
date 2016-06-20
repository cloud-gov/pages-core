
import ReactDOM from 'react-dom';
import React from 'react';

import buildActions from './actions/buildActions';
import siteActions from './actions/siteActions';
import userActions from './actions/userActions';

import App from './components/app';
import Header from './components/header';

import router from './router';
import store from './store';

const mainEl = document.querySelector('#js-app');

store.subscribe(() => {
  const state = store.getState();
  const isLoggedIn = (state.user) ? true : false;
  if (!isLoggedIn) return;

  ReactDOM.render(
    <div>
      <Header isLoggedIn={ isLoggedIn } />
      <App state={ state } />
    </div>
    , mainEl
  );
});

router.init();

userActions.fetchUser();
siteActions.fetchSites();
// buildActions.fetchBuilds();

window.router = router;
window.store = store;
