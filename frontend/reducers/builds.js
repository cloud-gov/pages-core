import {
  buildsReceivedType as BUILDS_RECEIVED,
  buildRestartedType as BUILD_RESTARTED,
} from "../actions/actionCreators/buildActions";

export default function builds(state = [], action) {
  switch (action.type) {
  case BUILDS_RECEIVED:
    return action.builds;
  case BUILD_RESTARTED:
    return [action.build, ...state];
  default:
    return state;
  }
}
