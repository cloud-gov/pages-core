import {
  githubBranchesFetchStartedType as GITHUB_BRANCHES_FETCH_STARTED,
  githubBranchesReceivedType as GITHUB_BRANCHES_RECEIVED,
  githubBranchesFetchErrorType as GITHUB_BRANCHES_FETCH_ERROR,
} from "../actions/actionCreators/githubBranchActions"

const initialState = {
  isLoading: false,
}

export default function githubBranches(state = initialState, action) {
  switch (action.type) {
  case GITHUB_BRANCHES_FETCH_STARTED:
    return {
      isLoading: true,
    }
  case GITHUB_BRANCHES_RECEIVED:
    return {
      isLoading: false,
      data: action.branches,
    }
  case GITHUB_BRANCHES_FETCH_ERROR:
    return {
      isLoading: false,
      error: action.error,
    }
  default:
    return state
  }
}
