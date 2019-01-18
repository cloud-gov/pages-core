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

const RepoLastVerified = ({ site = {}, daysNotVerified = 5 }) => {
  if ((!site.repoLastVerified &&
      (((new Date() - new Date(site.createdAt)) / (24 * 60 * 60 * 1000)) > daysNotVerified)) ||
    (site.repoLastVerified &&
      (((new Date() - new Date(site.repoLastVerified)) / (24 * 60 * 60 * 1000)) > daysNotVerified))) {
    return <p className="repo-verification">
      {getRepoLastVerified(site)}
    </p>;
  }
  return (null);
}

RepoLastVerified.propTypes = {
  site: React.PropTypes.shape({
    repoLastVerified: React.PropTypes.string,
  }),
  daysNotVerified: React.PropTypes.number,
};

RepoLastVerified.defaultProps = {
  site: {},
  daysNotVerified: 5,
};

export default RepoLastVerified;
