import { buildsReceivedType as BUILDS_RECEIVED } from "../actions/actionCreators/buildActions";

export default function builds(state = [], action) {
  switch (action.type) {
  case BUILDS_RECEIVED:
    return action.builds;
  default:
    return state;
  }
}
