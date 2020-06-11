import {
  basicAuthFetchStartedType as FETCH_STARTED,
  basicAuthReceivedType as RECEIVED,
  basicAuthSavedType as SAVED,
  basicAuthRemovedType as REMOVED,
} from '../actions/actionCreators/basicAuthActions';

import {
  httpErrorType as HTTP_ERROR,
} from '../actions/actionCreators/alertActions';

/*
  Contains nested user environment variables keyed by site Id, Ex.
  {
    1: {
      isLoading: false,
      data: [
        <user environment variable object>,
        ...
      ]
    },
    ...
  }
*/
const initialState = {};

export default function basicAuth(state = initialState, action) {
  switch (action.type) {
    case HTTP_ERROR: {
      const { siteId } = action.payload || {};
      return {
        ...state,
        [siteId]: {
          isLoading: false,
          data: {},
        },
      };
    }

    case FETCH_STARTED: {
      const { siteId } = action.payload;
      return {
        ...state,
        [siteId]: {
          isLoading: true,
          data: {},
        },
      };
    }

    case RECEIVED: {
      const { siteId, basicAuth: credentials } = action.payload;
      return {
        ...state,
        [siteId]: {
          isLoading: false,
          data: credentials,
        },
      };
    }

    case SAVED: {
      const { siteId, basicAuth: credentials } = action.payload;
      return {
        ...state,
        [siteId]: {
          isLoading: false,
          data: credentials,
        },
      };
    }

    case REMOVED: {
      const { siteId } = action.payload;
      return {
        ...state,
        [siteId]: {
          isLoading: false,
          data: {},
        },
      };
    }

    default:
      return state;
  }
}
