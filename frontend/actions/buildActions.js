import api from '../util/federalistApi';
import { dispatch } from '../store';

import {
  buildsFetchStarted as createBuildsFetchStartedAction,
  buildsReceived as createBuildsReceivedAction,
  buildRestarted as createBuildRestartedAction,
} from "./actionCreators/buildActions";

const dispatchBuildsFetchStartedAction = () => {
  dispatch(createBuildsFetchStartedAction())
}

const dispatchBuildsReceivedAction = builds => {
  dispatch(createBuildsReceivedAction(builds))
}

const dispatchBuildRestartedAction = build => {
  dispatch(createBuildRestartedAction(build))
};

export default {
  fetchBuilds(site) {
    dispatchBuildsFetchStartedAction()
    return api.fetchBuilds(site)
      .then(dispatchBuildsReceivedAction)
  },

  restartBuild(build) {
    return api.restartBuild(build)
      .then(dispatchBuildRestartedAction);
  },
};
