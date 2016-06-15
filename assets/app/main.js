
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

<<<<<<< 0d9c0b67a0066c17d69ce32efd779d471c655b8b
window.router = router;
=======
store.subscribe(() => {
  const state = store.getState();
  if (state === previousState) return;
  if (state.user && !authed) {
    authed = true;
    updateLoginElement();
    if (state.currentView.id === viewTypes.HOME) router.setRoute('/dashboard');
  }
  previousState = state;
  render(state, mainEl);
  return;
});

const updateLoginElement = (loggedIn = true) => {
  if (loggedIn) return loginEl.innerHTML = `<a>Logout</a>`;
};

>>>>>>> Adds fetch, wrapper code
window.store = store;
