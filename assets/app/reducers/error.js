import { errorActionTypes } from '../constants';

const initialState = '';

export function error(state = initialState, action) {
  switch (action.type) {
  case errorActionTypes.HTTP_ERROR:
    state = action.error;
    return state;
  default:
    return state;
  }
}
