import {
  buildsFetchStartedType as BUILDS_FETCH_STARTED,
  buildsReceivedType as BUILDS_RECEIVED,
  buildRestartedType as BUILD_RESTARTED,
} from '../actions/actionCreators/buildActions';

const initialState = {
  isLoading: false,
  data: {},
};

export default function builds(state = initialState, action) {
  switch (action.type) {
    case BUILDS_FETCH_STARTED:
      return {
        ...state,
        isLoading: true,
      };
    case BUILDS_RECEIVED:
      return {
        isLoading: false,
        data: action.builds,
      };
    case BUILD_RESTARTED:
      return {
        isLoading: false,
        data: [action.build, ...state.data],
      };
    default:
      return state;
  }
}
