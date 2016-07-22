import { errorActionTypes } from '../constants';

export function error(state = '', action) {
  switch (action.type) {
  case errorActionTypes.HTTP_ERROR:
    state = action.error;
    return state;
  default:
    return state;
  }
}
