import {
  publishedBranchReceivedType as PUBLISHED_BRANCH_RECEIVED,
  publishedBranchesReceivedType as PUBLISHED_BRANCHES_RECEIVED,
} from "../actions/actionCreators/publishedBranchActions";

export default function publishedBranches(state = [], action) {
  switch (action.type) {
  case PUBLISHED_BRANCH_RECEIVED:
    const branches = state.concat()
    let index = branches.findIndex(branch => {
      return branch.name === action.branch.name && branch.site.id === action.branch.site.id
    })
    if (index < 0) {
      index = branches.length
    }
    branches[index] = action.branch
    return branches
  case PUBLISHED_BRANCHES_RECEIVED:
    return action.branches;
  default:
    return state;
  }
}
