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

const RepoLastVerified = ({ site = {}, daysNotFound = 5 }) => {
  if ((!site.repoLastVerified &&
      (((new Date() - new Date(site.createdAt)) / (24 * 60 * 60 * 1000)) > daysNotFound)) ||
    (site.repoLastVerified &&
      (((new Date() - new Date(site.repoLastVerified)) / (24 * 60 * 60 * 1000)) > daysNotFound))) {
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
  daysNotFound: React.PropTypes.number,
};

RepoLastVerified.defaultProps = {
  site: {},
  daysNotFound: 5,
};

export default RepoLastVerified;
