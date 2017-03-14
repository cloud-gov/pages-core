import {
  publishedBranchesReceivedType as PUBLISHED_BRANCHES_RECEIVED,
} from "../actions/actionCreators/publishedBranchActions";

export default function publishedBranches(state = [], action) {
  switch (action.type) {
  case PUBLISHED_BRANCHES_RECEIVED:
    return action.branches;
  default:
    return state;
  }
}
