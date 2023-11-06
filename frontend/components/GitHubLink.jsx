import React from 'react';
import PropTypes from 'prop-types';

import { IconGitHub, IconBranch } from './icons';

const BASE = 'https://github.com';

const GitHubLink = ({
  owner, repository, text, branch, sha, icon, ...props
}) => {
  const baseHref = `${BASE}/${owner}/${repository}`;

  let { title } = props;
  let href = baseHref;

  if (branch) {
    href = `${baseHref}/tree/${encodeURIComponent(branch)}`;
    title = 'View branch';
  } else if (sha) {
    href = `${baseHref}/commit/${sha}`;
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
      { icon === "branch" 
        ? <IconBranch />
        : <IconGitHub />
      }
      {text}
    </a>
  );
};

GitHubLink.propTypes = {
  owner: PropTypes.string.isRequired,
  repository: PropTypes.string.isRequired,
  text: PropTypes.string.isRequired,
  branch: PropTypes.string,
  sha: PropTypes.string,
  title: PropTypes.string,
  icon: PropTypes.string,
};

GitHubLink.defaultProps = {
  branch: null,
  sha: null,
  icon: null,
  title: 'View repository',
};

export default GitHubLink;
