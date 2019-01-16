import React from 'react';

import { dateAndTime } from '../../util/datetime';

const getRepoLastVerified = (site) => {
  if (site.repoLastVerified) {
    const formattedBuildTime = dateAndTime(site.repoLastVerified);
    return `Repository last verified on ${formattedBuildTime}.`;
  }
  return 'Unable to verify this repository exists.';
};

const RepoLastVerified = ({ site = {} }) => {
  console.log(`\n\nTIMEEE:\t${new Date(site.repoLastVerified)}\n${new Date()}\n\n`);
  console.log(`\n\nOK:\t${(new Date() - new Date(site.repoLastVerified))}\n\n`);
  if ((new Date() - new Date(site.repoLastVerified)) > 3 * 24 * 60 * 60 * 1000) {
    return;
  }
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
