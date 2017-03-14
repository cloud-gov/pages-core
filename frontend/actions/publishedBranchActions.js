import api from '../util/federalistApi';
import { dispatch } from '../store';

import {
  publishedBranchesReceived as createPublishedBranchesReceivedAction,
} from "./actionCreators/publishedBranchActions";

const dispatchPublishedBranchesReceivedAction = branches => {
  dispatch(createPublishedBranchesReceivedAction(branches));
}

export default {
  fetchPublishedBranches(site) {
    return api.fetchPublishedBranches(site)
      .then(dispatchPublishedBranchesReceivedAction);
  },
};
