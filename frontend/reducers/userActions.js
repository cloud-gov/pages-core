import {
  userActionFetchStartedType as USER_ACTIONS_FETCH_STARTED,
  userActionReceivedType as USER_ACTIONS_RECEIVED,
} from '../actions/actionCreators/userActions';

const initialState = {
  isLoading: false,
  data: [],
};

export default function userActions(state = initialState, action) {
  switch (action.type) {
    case USER_ACTIONS_FETCH_STARTED:
      return {
        ...initialState,
        isLoading: true,
      };

    case USER_ACTIONS_RECEIVED:
      return {
        isLoading: false,
        data: action.userActions,
      };

    default:
      return state;
  }
}
