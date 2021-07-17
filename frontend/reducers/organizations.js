import {
  organizationsFetchStartedType as ORGANIZATIONS_FETCH_STARTED,
  organizationsReceivedType as ORGANIZATIONS_RECEIVED,
} from '../actions/actionCreators/organizationActions';

import {
  httpErrorType as HTTP_ERROR,
} from '../actions/actionCreators/alertActions';

const initialState = {
  isLoading: false,
  data: [],
};

export default function organizations(state = initialState, action) {
  switch (action.type) {
    case HTTP_ERROR:
      return { ...state, isLoading: false };

    case ORGANIZATIONS_FETCH_STARTED:
      return { ...state, isLoading: true };

    case ORGANIZATIONS_RECEIVED: {
      const nextOrganizations = action.organizations || state.data;
      return {
        ...state,
        isLoading: false,
        data: nextOrganizations,
      };
    }

    default:
      return state;
  }
}
