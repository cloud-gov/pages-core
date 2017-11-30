import React from 'react';
import PropTypes from 'prop-types';

import GitHubMark from './GitHubMark';

const GitHubRepoLink = ({ owner, repository, branch, sha, children }) => {
  let href = `https://github.com/${owner}/${repository}`;
  let title = 'View repository';

  if (branch) {
    href = `${href}/tree/${encodeURIComponent(branch)}`;
    title = 'View branch';
  } else if (sha) {
    href = `${href}/commits/${sha}`;
    title = 'View commit';
  }

  return (
    <a
      className="repo-link"
      href={href}
      title={title}
      target="_blank"
      rel="noopener noreferrer"
    >
      { children || <GitHubMark /> }
    </a>
  );
};

GitHubRepoLink.propTypes = {
  owner: PropTypes.string.isRequired,
  repository: PropTypes.string.isRequired,
  branch: PropTypes.string,
  sha: PropTypes.string,
  children: PropTypes.node,
};

GitHubRepoLink.defaultProps = {
  branch: null,
  sha: null,
  children: null,
};

export default GitHubRepoLink;
