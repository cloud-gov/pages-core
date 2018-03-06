import api from '../util/federalistApi';
import { dispatch } from '../store';

import {
  buildLogsFetchStarted as createBuildLogsFetchStartedAction,
  buildLogsReceived as createBuildLogsReceivedAction,
} from './actionCreators/buildLogActions';

const dispatchBuildLogsFetchStartedAction = () => {
  dispatch(createBuildLogsFetchStartedAction());
};

const dispatchBuildLogsReceivedAction = (logs) => {
  dispatch(createBuildLogsReceivedAction(logs));
};

export default {
  fetchBuildLogs(build) {
    dispatchBuildLogsFetchStartedAction();
    return api.fetchBuildLogs(build)
      .then(dispatchBuildLogsReceivedAction);
  },
};
