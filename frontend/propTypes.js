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
  organizationId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  Domains: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number,
      names: PropTypes.string,
      context: PropTypes.string,
      origin: PropTypes.string,
      path: PropTypes.string,
      state: PropTypes.string,
      createdAt: PropTypes.string,
      updatedAt: PropTypes.string,
      siteBranchConfigId: PropTypes.number,
    })
  ),
  SiteBranchConfigs: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number,
      branch: PropTypes.string,
      s3Key: PropTypes.string,
      config: PropTypes.string,
      context: PropTypes.string,
      createdAt: PropTypes.string,
      updatedAt: PropTypes.string,
    })
  ),
  users: PropTypes.arrayOf(USER),
});

export const SITES = PropTypes.shape({
  data: PropTypes.arrayOf(SITE),
  isLoading: PropTypes.bool,
});

export const BUILD = PropTypes.shape({
  id: PropTypes.number,
  state: PropTypes.string,
  error: PropTypes.string,
  branch: PropTypes.string,
  requestedCommitSha: PropTypes.string,
  clonedCommitSha: PropTypes.string,
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

export const BUILD_LOG_DATA = PropTypes.objectOf(PropTypes.arrayOf(BUILD_LOG));

export const ORGANIZATION = PropTypes.shape({
  createdAt: PropTypes.string,
  id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  name: PropTypes.string.isRequired,
  updatedAt: PropTypes.string,
});

export const ORGANIZATIONS = PropTypes.shape({
  data: PropTypes.arrayOf(ORGANIZATION),
  isLoading: PropTypes.bool,
});

export const ROLE = PropTypes.shape({
  createdAt: PropTypes.string,
  id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  name: PropTypes.string.isRequired,
  updatedAt: PropTypes.string,
});

export const ORGANIZATION_ROLE = PropTypes.shape({
  createdAt: PropTypes.string,
  Organization: ORGANIZATION.isRequired,
  Role: ROLE.isRequired,
  updatedAt: PropTypes.string,
});

export const ORGANIZATION_ROLES = PropTypes.shape({
  data: PropTypes.arrayOf(ORGANIZATION_ROLE),
  isLoading: PropTypes.bool,
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
