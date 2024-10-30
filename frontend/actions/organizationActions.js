import federalist from '../util/federalistApi';
import alertActions from './alertActions';
import { dispatch } from '../store';
import {
  organizationsFetchStarted,
  organizationsReceived,
} from './actionCreators/organizationActions';

const dispatchOrganizationsFetchStartedAction = () => dispatch(organizationsFetchStarted);
const dispatchOrganizationsReceivedAction = (organizations) =>
  dispatch(organizationsReceived(organizations));

const alertError = (error) => {
  window.scrollTo(0, 0);
  alertActions.httpError(error.message);
};

export default {
  fetchOrganizations() {
    dispatchOrganizationsFetchStartedAction();
    return federalist
      .fetchOrganizations()
      .then(dispatchOrganizationsReceivedAction)
      .catch(alertError);
  },
};
