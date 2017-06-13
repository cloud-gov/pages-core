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

const store = createStore(
  reducer,
  composeWithDevTools(applyMiddleware(...middlewares))
);

const dispatch = store.dispatch;

export { dispatch };
export default store;
