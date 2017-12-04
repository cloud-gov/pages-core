import React from 'react';
import PropTypes from 'prop-types';

const GitHubRepoLink = ({ branch, sha, baseHref, children }) => {
  let title = 'View repository';
  let href = baseHref;

  if (branch) {
    href = `${baseHref}/tree/${encodeURIComponent(branch)}`;
    title = 'View branch';
  } else if (sha) {
    href = `${baseHref}/commits/${sha}`;
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
      { children }
    </a>
  );
};

GitHubRepoLink.propTypes = {
  baseHref: PropTypes.string.isRequired,
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
