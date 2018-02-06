import { reducer as notifications } from 'react-notification-system-redux';
import { reducer as form } from 'redux-form';

import buildLogs from './reducers/buildLogs';
import alert from './reducers/alert';
import publishedBranches from './reducers/publishedBranches';
import publishedFiles from './reducers/publishedFiles';
import sites from './reducers/sites';
import builds from './reducers/builds';
import user from './reducers/user';
import githubBranches from './reducers/githubBranches';
import showAddNewSiteFields from './reducers/showAddNewSiteFields';
import userActions from './reducers/userActions';

export default {
  buildLogs,
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
  FRONTEND_CONFIG: (state = {}) => state,
};
