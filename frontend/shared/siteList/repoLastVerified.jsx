import React from 'react';
import PropTypes from 'prop-types';
import { dateAndTime } from '../../util/datetime';

const getRepoLastVerified = (site) => {
  const formattedBuildTime = dateAndTime(site.repoLastVerified);
  return `Repository not found. Last seen on ${formattedBuildTime}.`;
};

const RepoLastVerified = ({ site, maxDaysUnverified, userUpdated }) => {
  const daysAgo = fromDate => (new Date() - new Date(fromDate)) / (24 * 60 * 60 * 1000);
  const minutesAgo = fromDate => (new Date() - new Date(fromDate)) / (60 * 1000);
  if ((daysAgo(site.repoLastVerified) > maxDaysUnverified)
    && (userUpdated && (minutesAgo(userUpdated) > 4))) { // user logged in 4 mins
    return (
      <p className="repo-verification">
        {getRepoLastVerified(site)}
      </p>
    );
  }
  return (null);
};

RepoLastVerified.propTypes = {
  site: PropTypes.shape({
    repoLastVerified: PropTypes.string,
    createdAt: PropTypes.string,
    userUpdated: PropTypes.string,
  }),
  maxDaysUnverified: PropTypes.number,
  userUpdated: PropTypes.string,
};

RepoLastVerified.defaultProps = {
  site: {},
  maxDaysUnverified: 5,
  userUpdated: new Date().toISOString(),
};

export default RepoLastVerified;
