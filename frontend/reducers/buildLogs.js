import {
  buildLogsReceivedType as BUILD_LOGS_RECEIVED,
} from "../actions/actionCreators/buildLogActions";

export default function buildLogs(state = [], action) {
  switch (action.type) {
  case BUILD_LOGS_RECEIVED:
    return action.logs;
  default:
    return state;
  }
}
