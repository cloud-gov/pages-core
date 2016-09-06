import { buildActionTypes } from "../constants";

export default function builds(state = [], action) {
  switch (action.type) {
  case buildActionTypes.BUILDS_RECEIVED:
    return action.builds;
  default:
    return state;
  }
}
