import github from '../util/githubApi';
import { dispatch } from '../store';

import {
  githubBranchesFetchStarted as createGithubBranchesFetchStartedAction,
  githubBranchesFetchError as createGithubBranchesFetchErrorAction,
  githubBranchesReceived as createGithubBranchesReceivedAction,
} from './actionCreators/githubBranchActions';

const dispatchGithubBranchesFetchStartedAction = () => {
  dispatch(createGithubBranchesFetchStartedAction());
};

const dispatchGithubBranchesReceivedAction = (branches) => {
  dispatch(createGithubBranchesReceivedAction(branches));
};

const dispatchGithubBranchesFetchError = (error) => {
  dispatch(createGithubBranchesFetchErrorAction(error));
};

export default {
  fetchBranches(site) {
    dispatchGithubBranchesFetchStartedAction();
    return github
      .fetchBranches(site)
      .then(dispatchGithubBranchesReceivedAction)
      .catch(dispatchGithubBranchesFetchError);
  },
};
