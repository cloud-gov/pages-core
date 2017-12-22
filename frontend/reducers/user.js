import {
  userFetchStartedType as USER_FETCH_STARTED,
  userReceivedType as USER_RECEIVED,
} from '../actions/actionCreators/userActions';

const initialState = {
  isLoading: false,
};

export default function user(state = initialState, action) {
  switch (action.type) {
    case USER_FETCH_STARTED:
      return {
        isLoading: true,
      };
    case USER_RECEIVED:
      // TODO: When does this happen? Should this happen, or should
      // an error be thrown instead?
      if (!action.user) {
        return false;
      }

      return {
        isLoading: false,
        data: {
          ...action.user
        },
      };
    default:
      return state;
  }
}
