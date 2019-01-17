import React from 'react';

import { dateAndTime } from '../../util/datetime';

const getRepoLastVerified = (site) => {
  let msg = 'Repository not found';
  if (site.repoLastVerified) {
    const formattedBuildTime = dateAndTime(site.repoLastVerified);
    msg += `. Last seen on ${formattedBuildTime}.`;
  }
  return msg;
};

const RepoLastVerified = ({ site = {} }) => {
  return <p className="repo-verification">
    {getRepoLastVerified(site)}
  </p>;
}

RepoLastVerified.propTypes = {
  site: React.PropTypes.shape({
    repoLastVerified: React.PropTypes.string,
  }),
};

RepoLastVerified.defaultProps = {
  site: {},
};

export default RepoLastVerified;
