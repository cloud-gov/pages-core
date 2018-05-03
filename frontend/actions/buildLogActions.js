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

const fetchBuildLogs = (build) => {
	dispatchBuildLogsFetchStartedAction();
	return fetchNextBuildLogsPage(build, 1);
}

const fetchNextBuildLogsPage = (build, page) => {
	return api.fetchBuildLogs(build, page).then(buildLogs => {
		dispatchBuildLogsReceivedAction(buildLogs);
		if (buildLogs.length > 0 ) {
			return fetchNextBuildLogsPage(build, page+1);
		}
	});
}
export default {
  fetchBuildLogs
};
