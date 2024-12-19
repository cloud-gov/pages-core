import { buildRestartedType } from '../actions/actionCreators/buildActions';

const initialState = {
  isLoading: false,
  data: [],
};

export default function builds(state = initialState, action) {
  if (action.type === buildRestartedType) {
    return {
      isLoading: false,
      data: [action.build, ...state.data],
    };
  }

  return state;
}
