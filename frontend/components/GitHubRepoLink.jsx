import React from 'react';
import PropTypes from 'prop-types';

import GitHubMark from './GitHubMark';

const GitHubRepoLink = ({ owner, repository }) => (
  <a
    className="repo-link"
    href={`https://github.com/${owner}/${repository}`}
    title="Visit repository"
    target="_blank"
    rel="noopener noreferrer"
  >
    <GitHubMark />
  </a>
);

GitHubRepoLink.propTypes = {
  owner: PropTypes.string.isRequired,
  repository: PropTypes.string.isRequired,
};

export default GitHubRepoLink;
