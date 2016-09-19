import { alertActionTypes as types } from '../../constants';

const authErrorType = types.AUTH_ERROR;
const httpErrorType = types.HTTP_ERROR;
const httpSuccessType = types.HTTP_SUCCESS;
const setStaleType = types.SET_STALE;
const clearType = types.CLEAR;

const authError = () => ({
  type: authErrorType
});

const httpError = message => ({
  type: httpErrorType,
  status: 'error',
  message
});

const httpSuccess = message => ({
  type: httpSuccessType,
  status: 'info',
  message
});

const setStale = () => ({
  type: setStaleType
});

const clear = () => ({
  type: clearType
});

export {
  authError, authErrorType,
  httpError, httpErrorType,
  httpSuccess, httpSuccessType,
  setStale, setStaleType,
  clear, clearType
};
