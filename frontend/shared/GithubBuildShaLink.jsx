import React from 'react';
import PropTypes from 'prop-types';
import SourceCodePlatformLink from './SourceCodePlatformLink';

export default function GithubBuildShaLink({ build, site }) {
  const { sourceCodePlatform, sourceCodeUrl } = site;
  const sha = build.clonedCommitSha || build.requestedCommitSha;
  if (sha) {
    return (
      <SourceCodePlatformLink
        sourceCodePlatform={sourceCodePlatform}
        sourceCodeUrl={sourceCodeUrl}
        sha={sha}
        branch={null}
        text={sha.slice(0, 7)}
        icon="sha"
      />
    );
  }
  return null;
}

GithubBuildShaLink.propTypes = {
  build: PropTypes.shape({
    clonedCommitSha: PropTypes.string,
    requestedCommitSha: PropTypes.string,
  }).isRequired,
  site: PropTypes.shape({
    sourceCodePlatform: PropTypes.string.isRequired,
    sourceCodeUrl: PropTypes.string.isRequired,
  }).isRequired,
};
