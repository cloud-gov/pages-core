import React from 'react';
import PropTypes from 'prop-types';

import GitHubMark from './GitHubMark';

const GitHubRepoLink = ({ owner, repository, branch }) => {
  let href = `https://github.com/${owner}/${repository}`;
  let title = 'View repository';

  if (branch) {
    href += `/tree/${encodeURIComponent(branch)}`;
    title = 'View branch';
  }

  return (
    <a
      className="repo-link"
      href={href}
      title={title}
      target="_blank"
      rel="noopener noreferrer"
    >View repo&nbsp;
      <GitHubMark />
    </a>
  );
};

GitHubRepoLink.propTypes = {
  owner: PropTypes.string.isRequired,
  repository: PropTypes.string.isRequired,
  branch: PropTypes.string,
};

GitHubRepoLink.defaultProps = {
  branch: null,
};

export default GitHubRepoLink;
