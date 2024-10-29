import {
  httpErrorType as HTTP_ERROR,
  httpSuccessType as HTTP_SUCCESS,
  setStaleType as SET_STALE,
  clearType as CLEAR,
} from '../actions/actionCreators/alertActions';

const initialState = {
  message: '',
  status: '',
  stale: false,
};

export default function alert(state = initialState, action) {
  switch (action.type) {
    case HTTP_ERROR:
    case HTTP_SUCCESS:
      return {
        ...state,
        message: action.message,
        status: action.status,
      };
    case SET_STALE:
      return {
        ...state,
        stale: true,
      };
    case CLEAR:
      return initialState;
    default:
      return state;
  }
}
