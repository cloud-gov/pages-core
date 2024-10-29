import {
  userEnvironmentVariablesFetchStartedType as FETCH_STARTED,
  userEnvironmentVariablesReceivedType as RECEIVED,
  userEnvironmentVariableAddedType as ADDED,
  userEnvironmentVariableDeletedType as DELETED,
} from '../actions/actionCreators/userEnvironmentVariableActions';

import { httpErrorType as HTTP_ERROR } from '../actions/actionCreators/alertActions';

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

export default function userEnvironmentVariables(state = initialState, action) {
  switch (action.type) {
    case HTTP_ERROR: {
      const { siteId } = action.payload || {};
      return {
        ...state,
        [siteId]: {
          isLoading: false,
          data: (state[siteId] || {}).data || [],
        },
      };
    }

    case FETCH_STARTED: {
      const { siteId } = action.payload;
      return {
        ...state,
        [siteId]: {
          isLoading: true,
          data: [],
        },
      };
    }

    case RECEIVED: {
      const { siteId, userEnvironmentVariables: uevs } = action.payload;
      return {
        ...state,
        [siteId]: {
          isLoading: false,
          data: uevs,
        },
      };
    }

    case ADDED: {
      const { siteId, userEnvironmentVariable: uev } = action.payload;
      return {
        ...state,
        [siteId]: {
          isLoading: false,
          data: [...((state[siteId] && state[siteId].data) || []), uev],
        },
      };
    }

    case DELETED: {
      const { siteId, userEnvironmentVariableId: uevId } = action.payload;
      return {
        ...state,
        [siteId]: {
          isLoading: false,
          data: state[siteId].data.filter((uev) => uev.id !== uevId),
        },
      };
    }

    default:
      return state;
  }
}
