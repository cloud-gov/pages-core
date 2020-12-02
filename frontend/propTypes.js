import PropTypes from 'prop-types';

export const ALERT = PropTypes.shape({
  message: PropTypes.string,
  status: PropTypes.string,
  stale: PropTypes.bool,
});

export const USER = PropTypes.shape({
  id: PropTypes.number,
  email: PropTypes.string,
  username: PropTypes.string,
});

export const SITE = PropTypes.shape({
  owner: PropTypes.string,
  repository: PropTypes.string,
  demoBranch: PropTypes.string,
  demoDomain: PropTypes.string,
  config: PropTypes.string,
  previewConfig: PropTypes.string,
  demoConfig: PropTypes.string,
  defaultBranch: PropTypes.string,
  domain: PropTypes.string,
  engine: PropTypes.string,
  s3ServiceName: PropTypes.string,
  awsBucketName: PropTypes.string,
  awsBucketRegion: PropTypes.string,
  users: PropTypes.arrayOf(USER),
});

export const BUILD = PropTypes.shape({
  id: PropTypes.number,
  state: PropTypes.string,
  error: PropTypes.string,
  branch: PropTypes.string,
  requestedCommitSha: PropTypes.string,
  completedAt: PropTypes.string,
  createdAt: PropTypes.string,
  user: PropTypes.shape({
    username: PropTypes.string,
  }),
});

export const BUILD_LOG = PropTypes.shape({
  source: PropTypes.string.isRequired,
  output: PropTypes.string.isRequired,
});

export const USER_ACTION = PropTypes.shape({
  targetType: PropTypes.string,
  createdAt: PropTypes.string,
  actionTarget: USER,
  actionType: PropTypes.shape({ action: PropTypes.string }),
  initiator: USER,
});

export const USER_ENVIRONMENT_VARIABLE = PropTypes.shape({
  id: PropTypes.number.isRequired,
  name: PropTypes.string.isRequired,
  hint: PropTypes.string.isRequired,
});

export const BASIC_AUTH = PropTypes.shape({
  username: PropTypes.string,
  password: PropTypes.string,
});
