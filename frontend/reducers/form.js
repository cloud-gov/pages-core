import { reducer as form } from 'redux-form';
import {
  userEnvironmentVariableAddedType as USER_ENVIRONMENT_VARIABLE_ADDED,
} from '../actions/actionCreators/userEnvironmentVariableActions';

export default form.plugin({
  environmentVariable: (state, action) => {
    switch (action.type) {
      case USER_ENVIRONMENT_VARIABLE_ADDED:
        return {
          ...state,
          values: {},
          registeredFields: {},
        };
      default:
        return state;
    }
  },
});
