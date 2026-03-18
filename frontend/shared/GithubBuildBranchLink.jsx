import React from 'react';
import PropTypes from 'prop-types';
import SourceCodePlatformLink from './SourceCodePlatformLink';

export default function GithubBuildBranchLink({ build, site }) {
  const { sourceCodePlatform, sourceCodeUrl } = site;
  const { branch } = build;

  return (
    <SourceCodePlatformLink
      sourceCodePlatform={sourceCodePlatform}
      sourceCodeUrl={sourceCodeUrl}
      sha={null}
      branch={branch}
      text={branch}
      icon="branch"
    />
  );
}

GithubBuildBranchLink.propTypes = {
  build: PropTypes.shape({
    branch: PropTypes.string.isRequired,
  }).isRequired,
  site: PropTypes.shape({
    owner: PropTypes.string.isRequired,
    repository: PropTypes.string.isRequired,
    sourceCodePlatform: PropTypes.string.isRequired,
    sourceCodeUrl: PropTypes.string.isRequired,
  }).isRequired,
};
