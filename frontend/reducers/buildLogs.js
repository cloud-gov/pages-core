import {
  buildLogsFetchStartedType as BUILD_LOGS_FETCH_STARTED,
  buildLogsReceivedType as BUILD_LOGS_RECEIVED,
} from '../actions/actionCreators/buildLogActions';

const initialState = {
  isLoading: false,
};

export default function buildLogs(state = initialState, action) {
  switch (action.type) {
    case BUILD_LOGS_FETCH_STARTED:
      return {
        isLoading: true,
      };
    case BUILD_LOGS_RECEIVED:
      return {
        isLoading: false,
        data: action.logs,
      };
    default:
      return state;
  }
}
