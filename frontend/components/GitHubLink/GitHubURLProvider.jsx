import React from 'react';
import PropTypes from 'prop-types';

const base = 'https://github.com';
const GitHubURLProvider = (Component) => {
  const GitHubURLWrapper = ({ owner, repository, ...props }) => {
    const baseHref = `${base}/${owner}/${repository}`;

    return <Component baseHref={baseHref} {...props} />;
  };

  GitHubURLWrapper.propTypes = {
    owner: PropTypes.string.isRequired,
    repository: PropTypes.string.isRequired,
  };

  return GitHubURLWrapper;
};

export default GitHubURLProvider;
