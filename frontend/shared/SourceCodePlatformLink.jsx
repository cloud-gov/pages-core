import React from 'react';
import PropTypes from 'prop-types';
import globals from '@globals';

import { IconBranch, IconGitHub, IconGitLab } from './icons';

const SourceCodePlatformLink = ({
  sourceCodePlatform,
  sourceCodeUrl,
  text,
  branch = null,
  sha = null,
  icon = 'repo',
  isButton = false,
}) => {
  let href = sourceCodeUrl;
  const isWorkshop = sourceCodePlatform == globals.SOURCE_CODE_PLATFORM_WORKSHOP;
  let title = isWorkshop ? 'View repository on Workshop' : 'View repository on GitHub';

  if (branch) {
    let tree = isWorkshop ? `/-/tree/` : `/tree/`;
    href = `${sourceCodeUrl}${tree}${encodeURIComponent(branch)}`;
    title = 'View branch on GitHub';
  } else if (sha) {
    href = `${sourceCodeUrl}/commit/${sha}`;
    title = isWorkshop ? 'View commit on GitLab' : 'View commit on GitHub';
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
        return isWorkshop ? <IconGitLab /> : <IconGitHub />;
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

SourceCodePlatformLink.propTypes = {
  sourceCodePlatform: PropTypes.string.isRequired,
  sourceCodeUrl: PropTypes.string.isRequired,
  text: PropTypes.string.isRequired,
  branch: PropTypes.string,
  isButton: PropTypes.bool,
  sha: PropTypes.string,
  icon: PropTypes.string,
};

export default SourceCodePlatformLink;
