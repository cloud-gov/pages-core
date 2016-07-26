import { alertActionTypes } from '../constants';

const initialState = {
  message: '',
  status: '',
  stale: false
};

export default function alert(state = initialState, action) {
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
  case alertActionTypes.SET_STALE:
    return Object.assign({}, state, {
      stale: true
    });
  case alertActionTypes.CLEAR:
    return initialState;
  default:
    return state;
  }
}
