import api from '../util/federalistApi';
import { dispatch } from '../store';

import {
  publishedBranchReceived as createPublishedBranchReceivedAction,
  publishedBranchesReceived as createPublishedBranchesReceivedAction,
} from "./actionCreators/publishedBranchActions";

const dispatchPublishedBranchReceivedAction = branch => {
  dispatch(createPublishedBranchReceivedAction(branch))
}

const dispatchPublishedBranchesReceivedAction = branches => {
  dispatch(createPublishedBranchesReceivedAction(branches))
}

export default {
  fetchPublishedBranch(site, name) {
    return api.fetchPublishedBranch(site, name)
      .then(dispatchPublishedBranchReceivedAction)
  },

  fetchPublishedBranches(site) {
    return api.fetchPublishedBranches(site)
      .then(dispatchPublishedBranchesReceivedAction)
  },
};
