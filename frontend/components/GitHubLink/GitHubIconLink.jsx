import React from 'react';
import GitHubURLProvider from './GitHubURLProvider';
import GitHubRepoLink from './GitHubRepoLink';
import GitHubMark from '../GitHubMark';

const GitHubIconLink = ({ ...props }) =>
  <GitHubRepoLink {...props}>
    <GitHubMark />
  </GitHubRepoLink>;

export default GitHubURLProvider(GitHubIconLink);
