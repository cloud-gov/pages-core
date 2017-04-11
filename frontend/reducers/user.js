import {
  userReceivedType as USER_RECEIVED
} from '../actions/actionCreators/userActions';

export default function user(state = false, action) {
  switch (action.type) {
  case USER_RECEIVED:
    if (!action.user) {
      return false
    }

    return {
      id: action.user.id,
      username: action.user.username,
      email: action.user.email,
      createdAt: action.user.createdAt,
      updatedAt: action.user.updatedAt
    };
  default:
    return state;
  }
}
