import {
  basicAuthFetchStartedType as FETCH_STARTED,
  basicAuthReceivedType as RECEIVED,
  basicAuthSavedType as SAVED,
  basicAuthRemovedType as REMOVED,
} from '../actions/actionCreators/basicAuthActions';

import {
  httpErrorType as HTTP_ERROR,
} from '../actions/actionCreators/alertActions';

const initialState = {
  isLoading: false,
  data: {},
};

export default function basicAuth(state = initialState, action) {
  switch (action.type) {
    case HTTP_ERROR: {
      return {
        isLoading: false,
        data: {},
      };
    }

    case FETCH_STARTED: {
      return {
        isLoading: true,
        data: {},
      };
    }

    case RECEIVED: {
      const { basicAuth: credentials } = action.payload;
      return {
        isLoading: false,
        data: credentials,
      };
    }

    case SAVED: {
      const { basicAuth: credentials } = action.payload;
      return {
        isLoading: false,
        data: credentials,
      };
    }

    case REMOVED: {
      return {
        isLoading: false,
        data: {},
      };
    }

    default:
      return state;
  }
}
