import {
  publishedBranchesFetchStartedType as PUBLISHED_BRANCHES_FETCH_STARTED,
  publishedBranchesReceivedType as PUBLISHED_BRANCHES_RECEIVED,
} from '../actions/actionCreators/publishedBranchActions';

const initialState = { isLoading: false, data: [] };

export default function publishedBranches(state = initialState, action) {
  switch (action.type) {
    case PUBLISHED_BRANCHES_FETCH_STARTED:
      return { isLoading: true };
    case PUBLISHED_BRANCHES_RECEIVED:
      return { isLoading: false, data: action.branches };
    default:
      return state;
  }
}
