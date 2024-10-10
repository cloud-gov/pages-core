import React from 'react';
import PropTypes from 'prop-types';
import GitHubLink from './GitHubLink';

export default function GithubBuildShaLink({ build, site }) {
  const { owner, repository } = site;
  const sha = build.clonedCommitSha || build.requestedCommitSha;
  if (sha) {
    return (
      <GitHubLink
        owner={owner}
        repository={repository}
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
    owner: PropTypes.string.isRequired,
    repository: PropTypes.string.isRequired,
  }).isRequired,
};
