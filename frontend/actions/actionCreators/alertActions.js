const authErrorType = 'AUTH_ERROR';
const httpErrorType = 'HTTP_ERROR';
const httpSuccessType = 'HTTP_SUCCESS';
const setStaleType = 'SET_STALE';
const clearType = 'CLEAR';

const authError = () => ({
  type: authErrorType,
});

const httpError = (message, payload = {}) => ({
  type: httpErrorType,
  status: 'error',
  message,
  payload,
});

const httpSuccess = message => ({
  type: httpSuccessType,
  status: 'info',
  message,
});

const setStale = () => ({
  type: setStaleType,
});

const clear = () => ({
  type: clearType,
});

export {
  authError, authErrorType,
  httpError, httpErrorType,
  httpSuccess, httpSuccessType,
  setStale, setStaleType,
  clear, clearType,
};
