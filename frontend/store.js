/* global window */
import { combineReducers, createStore, applyMiddleware } from 'redux';
import { createLogger } from 'redux-logger';
import { composeWithDevTools } from 'redux-devtools-extension';
import { routerReducer } from 'react-router-redux';

import reducers from './reducers';
import { reroute, createNotifier } from './middleware';
import { notificationSettings } from './util/notificationSettings';

const reducer = combineReducers({
  ...reducers,
  routing: routerReducer,
});

const middlewares = [
  reroute,
  createNotifier(notificationSettings),
  createLogger(), // must be last in the middlewares chain
];

// FRONTEND_CONFIG is a global variable rendered into the index
// template by the Main controller. We use it to initialize our
// store's state with configuration values from the server-side.
const FRONTEND_CONFIG = typeof window !== 'undefined'
  ? window.FRONTEND_CONFIG
  : global.FRONTEND_CONFIG;

const store = createStore(
  reducer,
  { FRONTEND_CONFIG },
  composeWithDevTools(applyMiddleware(...middlewares))
);

const dispatch = store.dispatch;

export { dispatch };
export default store;
