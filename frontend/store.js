import { combineReducers, createStore, applyMiddleware } from 'redux';
import { createLogger } from 'redux-logger';

import reducers from './reducers';
import { reroute, createNotifier } from './middleware';
import { notificationSettings } from './util/notificationSettings';

const app = combineReducers(reducers);

const middlewares = [
  reroute,
  createNotifier(notificationSettings),
  createLogger(), // must be last in the middlewares chain
];

const store = createStore(
  app,
  applyMiddleware(...middlewares)
);

const dispatch = store.dispatch;

export { dispatch };
export default store;
