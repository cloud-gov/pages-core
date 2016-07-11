import { combineReducers, createStore, applyMiddleware } from 'redux';
import * as reducers from './reducers'

const app = combineReducers(reducers)

const logger = store => next => action => {
  console.log('::dispatching::', action);
  let result = next(action);
  console.log('::next state::', _store.getState());
  return result;
};

const _store = createStore(app, applyMiddleware(logger));

export default _store;
