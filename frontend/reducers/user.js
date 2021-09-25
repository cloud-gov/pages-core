import {
  userFetchStartedType as USER_FETCH_STARTED,
  userReceivedType as USER_RECEIVED,
  userSettingsUpdatedType as USER_SETTINGS_UPDATED,
} from '../actions/actionCreators/userActions';

const initialState = {
  isLoading: false,
  data: {},
};

export default function user(state = initialState, action) {
  switch (action.type) {
    case USER_FETCH_STARTED:
      return {
        ...state,
        isLoading: true,
      };
    case USER_SETTINGS_UPDATED:
    case USER_RECEIVED:
      // TODO: When does this happen? Should this happen, or should
      // an error be thrown instead?
      if (!action.user) {
        return false;
      }

      return {
        isLoading: false,
        data: {
          ...action.user,
        },
      };
    default:
      return state;
  }
}
