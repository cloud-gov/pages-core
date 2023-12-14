import {
  buildFetchStartedType as BUILD_FETCH_STARTED,
  buildReceivedType as BUILD_RECEIVED,
} from '../actions/actionCreators/buildActions';

const initialState = {
  isLoading: false,
  data: null,
};

export default function build(state = initialState, action) {
  switch (action.type) {
    case BUILD_FETCH_STARTED:
      return {
        ...state,
        isLoading: true,
      };
    case BUILD_RECEIVED:
      return {
        isLoading: false,
        data: { ...action.build, ...state.data },
      };
    default:
      return state;
  }
}
