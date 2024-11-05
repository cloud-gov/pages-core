import React from 'react';
import PropTypes from 'prop-types';

import { IconGitHub, IconBranch } from './icons';

const BASE = 'https://github.com';

const GitHubLink = ({
  owner,
  repository,
  text,
  branch = null,
  sha = null,
  icon = 'repo',
  isButton = false,
}) => {
  const baseHref = `${BASE}/${owner}/${repository}`;

  let href = baseHref;
  let title = 'View repository on GitHub';

  if (branch) {
    href = `${baseHref}/tree/${encodeURIComponent(branch)}`;
    title = 'View branch on GitHub';
  } else if (sha) {
    href = `${baseHref}/commit/${sha}`;
    title = 'View commit on GitHub';
  }
  function chooseIcon(iconStr) {
    switch (iconStr) {
      case 'branch':
        return <IconBranch />;
      case 'commit':
      case 'sha':
        // use no icon for these types of links
        return '';
      case 'repo':
      default:
        return <IconGitHub />;
    }
  }

  const isButtonClassName = isButton ? 'usa-button usa-button--outline' : 'usa-link';

  return (
    <a
      className={`${icon}-link ${isButtonClassName}`}
      href={href}
      title={title}
      target="_blank"
      rel="noopener noreferrer"
    >
      {chooseIcon(icon)}
      {text}
    </a>
  );
};

GitHubLink.propTypes = {
  owner: PropTypes.string.isRequired,
  repository: PropTypes.string.isRequired,
  text: PropTypes.string.isRequired,
  branch: PropTypes.string,
  isButton: PropTypes.bool,
  sha: PropTypes.string,
  icon: PropTypes.string,
};

export default GitHubLink;
