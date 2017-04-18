import api from '../util/federalistApi';
import { dispatch } from '../store';

import {
  buildRestarted as createBuildRestartedAction,
} from "./actionCreators/buildActions";

const dispatchBuildRestartedAction = build => {
  dispatch(createBuildRestartedAction(build))
};

export default {
  restartBuild(build) {
    return api.restartBuild(build)
      .then(dispatchBuildRestartedAction);
  },
};
