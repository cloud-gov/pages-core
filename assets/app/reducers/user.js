import {
  userReceivedType as USER_RECEIVED
} from '../actions/actionCreators/userActions';

export default function user(state = false, action) {
  switch (action.type) {
  case USER_RECEIVED:
    return {
      id: action.user.id,
      username: action.user.username,
      email: action.user.email,
      githubAccessToken: action.user.githubAccessToken,
      createdAt: action.user.createdAt,
      updatedAt: action.user.updatedAt
    };
  default:
    return state;
  }
}
