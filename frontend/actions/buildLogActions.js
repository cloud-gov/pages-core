import api from '../util/federalistApi';
import { dispatch } from '../store';

import {
  buildLogsReceived as createBuildLogsReceivedAction,
} from "./actionCreators/buildLogActions";

const dispatchBuildLogsReceivedAction = logs => {
  dispatch(createBuildLogsReceivedAction(logs));
}

export default {
  fetchBuildLogs(build) {
    return api.fetchBuildLogs(build)
      .then(dispatchBuildLogsReceivedAction);
  },
};
