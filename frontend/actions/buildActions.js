import api from '../util/federalistApi';
import { dispatch } from '../store';

import { buildRestarted } from './actionCreators/buildActions';

import alertActions from './alertActions';

const dispatchBuildRestartedAction = (build) => {
  dispatch(buildRestarted(build));
};

export default {
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
