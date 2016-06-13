
import { Router } from 'director';

import render from './app';
import routes from './routes';
import store from './store';

import buildActions from './actions/buildActions';
import siteActions from './actions/siteActions';
import userActions from './actions/userActions';

import { viewTypes } from './constants';

const router = Router(routes);
router.init();

let authed = false;
let previousState = store.getState();

const mainEl = document.querySelector('main');
const loginEl = document.querySelector('[href="/auth/github"]');

render(store.getState(), mainEl);

userActions.fetchUser();
siteActions.fetchSites();
// buildActions.fetchBuilds();

store.subscribe(() => {
  let state = store.getState();
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

window.store = store;
