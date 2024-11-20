import { buildRestartedType } from '../actions/actionCreators/buildActions';

const initialState = {
  isLoading: false,
  data: [],
};

export default function builds(state = initialState, action) {
  switch (action.type) {
    case buildRestartedType:
      return {
        isLoading: false,
        data: [action.build, ...state.data],
      };
    default:
      return state;
  }
}
