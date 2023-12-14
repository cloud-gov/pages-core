import api from '../util/federalistApi';
import { dispatch } from '../store';

import {
  buildsFetchStarted as createBuildsFetchStartedAction,
  buildsReceived as createBuildsReceivedAction,
  buildFetchStarted as createBuildFetchStartedAction,
  buildReceived as createBuildReceivedAction,
  buildRestarted as createBuildRestartedAction,
} from './actionCreators/buildActions';

import alertActions from './alertActions';

const dispatchBuildsFetchStartedAction = () => {
  dispatch(createBuildsFetchStartedAction());
};

const dispatchBuildsReceivedAction = (builds) => {
  dispatch(createBuildsReceivedAction(builds));
};

const dispatchBuildFetchStartedAction = () => {
  dispatch(createBuildFetchStartedAction());
};

const dispatchBuildReceivedAction = (build) => {
  dispatch(createBuildReceivedAction(build));
};

const dispatchBuildRestartedAction = (build) => {
  dispatch(createBuildRestartedAction(build));
};

export default {
  fetchBuilds(site) {
    dispatchBuildsFetchStartedAction();
    return api.fetchBuilds(site)
      .then(dispatchBuildsReceivedAction);
  },

  fetchBuild(buildId) {
    dispatchBuildFetchStartedAction();
    return api.fetchBuild(buildId)
      .then(dispatchBuildReceivedAction);
  },

  restartBuild(buildId, siteId) {
    return api.restartBuild(buildId, siteId)
      .then((build) => {
        if (Object.keys(build).length > 0) {
          dispatchBuildRestartedAction(build);
        } else {
          alertActions.alertSuccess('Build is already queued.');
        }
      });
  },
};
