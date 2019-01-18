import React from 'react';

import { dateAndTime } from '../../util/datetime';

const getRepoLastVerified = site => {
  let msg = 'Repository not found';
  if (site.repoLastVerified) {
    const formattedBuildTime = dateAndTime(site.repoLastVerified);
    msg += `. Last seen on ${formattedBuildTime}.`;
  }
  return msg;
};

const RepoLastVerified = ({ site, daysNotVerified = 5 }) => {
  const daysAgo = fromDate => (new Date() - new Date(fromDate)) / (24 * 60 * 60 * 1000);
  if ((daysAgo(site.repoLastVerified || site.createdAt) > daysNotVerified)) {
    return (<p className="repo-verification">
      {getRepoLastVerified(site)}
    </p>);
  }
  return (null);
};

RepoLastVerified.propTypes = {
  site: React.PropTypes.shape({
    repoLastVerified: React.PropTypes.string,
    createdAt: React.PropTypes.string,
  }),
  daysNotVerified: React.PropTypes.number,
};

RepoLastVerified.defaultProps = {
  site: {},
  daysNotVerified: 5,
};

export default RepoLastVerified;
