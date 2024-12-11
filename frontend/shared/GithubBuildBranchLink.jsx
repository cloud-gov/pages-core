import React from 'react';
import PropTypes from 'prop-types';
import GitHubLink from './GitHubLink';

export default function GithubBuildBranchLink({ build, site }) {
  const { owner, repository } = site;
  const { branch } = build;

  return (
    <GitHubLink
      owner={owner}
      repository={repository}
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
  }).isRequired,
};
