import { alertActionTypes } from '../constants';

const initialState = {
  message: '',
  status: ''
};

export function alert(state = initialState, action) {
  switch (action.type) {
  case alertActionTypes.HTTP_ERROR:
    return Object.assign({}, state, {
      message: action.message,
      status: action.status
    });
  case alertActionTypes.HTTP_SUCCESS:
    return Object.assign({}, state, {
      message: action.message,
      status: action.status
    });
  default:
    return state;
  }
}
