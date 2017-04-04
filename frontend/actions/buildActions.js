import api from '../util/federalistApi';
import { dispatch } from '../store';

import {
  buildsReceived as createBuildsReceivedAction,
  buildRestarted as createBuildRestartedAction,
} from "./actionCreators/buildActions";

const dispatchBuildsReceivedAction = builds => {
  dispatch(createBuildsReceivedAction(builds));
};

const dispatchBuildRestartedAction = build => {
  dispatch(createBuildRestartedAction(build))
};

export default {
  fetchBuilds() {
    return api.fetchBuilds()
      .then(dispatchBuildsReceivedAction);
  },

  restartBuild(build) {
    return api.restartBuild(build)
      .then(dispatchBuildRestartedAction);
  },
};
