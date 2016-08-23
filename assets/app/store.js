import { combineReducers, createStore, applyMiddleware } from 'redux';
import { browserHistory } from 'react-router';
import { navigationTypes } from './constants';
import reducers from './reducers';

const app = combineReducers(reducers);

const logger = store => next => action => {
  console.log('::dispatching::', action);
  let result = next(action);
  console.log('::next state::', _store.getState());
  return result;
};

const reroute = store => next => action => {
  if (action.type !== navigationTypes.UPDATE_ROUTER) {
    return next(action);
  }

  browserHistory[action.method].apply(browserHistory, action.arguments);
  return next(action);
};

const _store = createStore(app, applyMiddleware(logger, reroute));

export default _store;
