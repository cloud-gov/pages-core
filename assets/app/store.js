import { combineReducers, createStore } from 'redux';
import * as reducers from './reducers'

const app = combineReducers(reducers)
const _store = createStore(app);

let next = _store.dispatch;
_store.dispatch = function dispatchAndLog(action) {
  console.log('::dispatching::', action);
  let result = next(action);
  console.log('::next state::', _store.getState());
  return result;
}

export default _store;
