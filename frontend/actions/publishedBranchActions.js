import api from '../util/federalistApi';
import { dispatch } from '../store';

import {
  publishedBranchesFetchStarted as createPublishedBranchesFetchStartedAction,
  publishedBranchesReceived as createPublishedBranchesReceivedAction,
} from './actionCreators/publishedBranchActions';

const dispatchPublishedBranchesFetchStartedAction = () => {
  dispatch(createPublishedBranchesFetchStartedAction());
};

const dispatchPublishedBranchesReceivedAction = (branches) => {
  dispatch(createPublishedBranchesReceivedAction(branches));
};

export default {
  fetchPublishedBranches(site) {
    dispatchPublishedBranchesFetchStartedAction();
    return api.fetchPublishedBranches(site).then(dispatchPublishedBranchesReceivedAction);
  },
};
