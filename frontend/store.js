/* global window */
import { combineReducers, compose, createStore, applyMiddleware } from 'redux';
import logger from 'redux-logger';
import { composeWithDevTools } from 'redux-devtools-extension';
import { routerReducer } from 'react-router-redux';

import reducers from './reducers';
import { reroute, createNotifier } from './middleware';
import { notificationSettings } from './util/notificationSettings';

const reducer = combineReducers({
  ...reducers,
  routing: routerReducer,
});

// FRONTEND_CONFIG is a global variable rendered into the index
// template by the Main controller. We use it to initialize our
// store's state with configuration values from the server-side.
const FRONTEND_CONFIG = typeof window !== 'undefined'
  ? window.FRONTEND_CONFIG
  : global.FRONTEND_CONFIG;

const middlewares = [
  reroute,
  createNotifier(notificationSettings),
];

const enhancers = [
  applyMiddleware,
];

if (process.env.NODE_ENV !== 'production') {
  middlewares.push(logger);
  enhancers.unshift(composeWithDevTools);
}

const store = createStore(
  reducer,
  { FRONTEND_CONFIG },
  compose(...enhancers)(...middlewares)
);

const dispatch = store.dispatch;

export { dispatch };
export default store;
