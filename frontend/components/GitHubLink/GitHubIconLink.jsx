import React from 'react';
import GitHubURLProvider from './GitHubURLProvider';
import GitHubRepoLink from './GitHubRepoLink';
import { IconGitHub } from '../icons';

const GitHubIconLink = ({ ...props }) =>
  <GitHubRepoLink {...props}>
    <IconGitHub />
  </GitHubRepoLink>;

export default GitHubURLProvider(GitHubIconLink);
