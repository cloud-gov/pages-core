import React from 'react';
import PropTypes from 'prop-types';
import GitHubURLProvider from './GitHubURLProvider';
import GitHubRepoLink from './GitHubRepoLink';

const propTypes = {
  children: PropTypes.node
};

const GitHubLink = GitHubURLProvider(({ ...props, children }) =>
  <GitHubRepoLink {...props}>
    { children }
  </GitHubRepoLink>
);

export default GitHubLink;
