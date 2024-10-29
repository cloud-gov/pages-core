import api from '../util/federalistApi';
import { dispatch } from '../store';

import {
  buildsFetchStarted as createBuildsFetchStartedAction,
  buildsReceived as createBuildsReceivedAction,
  buildRestarted as createBuildRestartedAction,
} from './actionCreators/buildActions';

import alertActions from './alertActions';

const dispatchBuildsFetchStartedAction = () => {
  dispatch(createBuildsFetchStartedAction());
};

const dispatchBuildsReceivedAction = (builds) => {
  dispatch(createBuildsReceivedAction(builds));
};

const dispatchBuildRestartedAction = (build) => {
  dispatch(createBuildRestartedAction(build));
};

export default {
  fetchBuilds(site) {
    dispatchBuildsFetchStartedAction();
    return api.fetchBuilds(site).then(dispatchBuildsReceivedAction);
  },

  refetchBuilds(site) {
    return api.fetchBuilds(site).then(dispatchBuildsReceivedAction);
  },

  restartBuild(buildId, siteId) {
    return api.restartBuild(buildId, siteId).then((build) => {
      if (Object.keys(build).length > 0) {
        dispatchBuildRestartedAction(build);
      } else {
        alertActions.alertSuccess('Build is already queued.');
      }
    });
  },
};
