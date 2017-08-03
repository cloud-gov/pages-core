import PropTypes from 'prop-types';

export const SITE = PropTypes.shape({
  demoBranch: PropTypes.string,
  demoDomain: PropTypes.string,
  config: PropTypes.string,
  previewConfig: PropTypes.string,
  demoConfig: PropTypes.string,
  defaultBranch: PropTypes.string,
  domain: PropTypes.string,
  engine: PropTypes.string,
});

export const GITHUB_BRANCHES = PropTypes.shape({
  error: PropTypes.object,
  isLoading: PropTypes.bool.isRequired,
  data: PropTypes.array,
});
