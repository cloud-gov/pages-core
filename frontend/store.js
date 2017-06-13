import { combineReducers, createStore, applyMiddleware } from 'redux';
import { createLogger } from 'redux-logger';

import reducers from './reducers';
import { reroute, notify } from './middleware';


const app = combineReducers(reducers);

const middlewares = [
  reroute,
  notify,
  createLogger(), // must be last in the middlewares chain
];

const store = createStore(
  app,
  applyMiddleware(...middlewares)
);

const dispatch = store.dispatch;

export { dispatch };
export default store;
