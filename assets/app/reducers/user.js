import { userActionTypes } from '../constants';

export function user(state = false, action) {
  switch (action.type) {
  case userActionTypes.USER_RECEIVED:
    return {
      id: action.user.id,
      username: action.user.username,
      email: action.user.email,
      passports: action.user.passports,
      createdAt: action.user.createdAt,
      updatedAt: action.user.updatedAt
    };
  default:
    return state;
  }
}
