import api from '../util/federalistApi';
import { dispatch } from '../store';

import {
  buildsReceived as createBuildsReceivedAction
} from "./actionCreators/buildActions";

const dispatchBuildsReceivedAction = builds => {
  dispatch(createBuildsReceivedAction(builds));
};

export default {
  fetchBuilds() {
    return api.fetchBuilds()
      .then(dispatchBuildsReceivedAction);
  }
};
