import api from '../util/federalistApi';
import { dispatch } from '../store';

import {
  buildLogsFetchStarted as createBuildLogsFetchStartedAction,
  buildLogsReceived as createBuildLogsReceivedAction,
} from './actionCreators/buildLogActions';

const dispatchBuildLogsFetchStartedAction = () => {
  dispatch(createBuildLogsFetchStartedAction());
};

const dispatchBuildLogsReceivedAction = (logs, page) => {
  dispatch(createBuildLogsReceivedAction({ logs, page }));
};

const fetchNextBuildLogsPage = (build, page) => api.fetchBuildLogs(build, page)
  .then((buildLogs) => {
    dispatchBuildLogsReceivedAction(buildLogs, page);
    if (buildLogs && buildLogs.length > 0) {
      return fetchNextBuildLogsPage(build, page + 1);
    }
    return Promise.resolve();
  });

const fetchBuildLogs = (build) => {
  dispatchBuildLogsFetchStartedAction();
  return fetchNextBuildLogsPage(build, 1);
};

export default {
  fetchBuildLogs,
};
