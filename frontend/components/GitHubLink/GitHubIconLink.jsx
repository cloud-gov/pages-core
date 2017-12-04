import React from 'react';
import PropTypes from 'prop-types';
import GitHubURLProvider from './GitHubURLProvider';
import GitHubRepoLink from './GitHubRepoLink';
import GitHubMark from '../GitHubMark';

const GitHubIconLink = ({ ...props }) =>
  <GitHubRepoLink {...props}>
    <GitHubMark />
  </GitHubRepoLink>;

export default GitHubURLProvider(GitHubIconLink);
