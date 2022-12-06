import { reducer as notifications } from 'react-notification-system-redux';

import alert from './reducers/alert';
import publishedBranches from './reducers/publishedBranches';
import publishedFiles from './reducers/publishedFiles';
import sites from './reducers/sites';
import builds from './reducers/builds';
import user from './reducers/user';
import form from './reducers/form';
import githubBranches from './reducers/githubBranches';
import showAddNewSiteFields from './reducers/showAddNewSiteFields';
import userActions from './reducers/userActions';
import userEnvironmentVariables from './reducers/userEnvironmentVariables';
import organizations from './reducers/organizations';

export default {
  alert,
  publishedBranches,
  publishedFiles,
  sites,
  builds,
  user,
  githubBranches,
  notifications,
  form,
  showAddNewSiteFields,
  userActions,
  userEnvironmentVariables,
  organizations,
  FRONTEND_CONFIG: (state = {}) => state,
};
