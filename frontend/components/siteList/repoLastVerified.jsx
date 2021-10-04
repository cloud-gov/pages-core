import React from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import { dateAndTime } from '../../util/datetime';

const getRepoLastVerified = (site) => {
  const formattedBuildTime = dateAndTime(site.repoLastVerified);
  return `Repository not found. Last seen on ${formattedBuildTime}.`;
};

const RepoLastVerified = ({ site, daysNotVerified = 5, userUpdated }) => {
  const ago = (fromDate, timeUnit = 'days') => moment().diff(moment(fromDate), timeUnit);
  if ((ago(site.repoLastVerified) > daysNotVerified)
    && (userUpdated && (ago(userUpdated, 'minutes') > 4))) { // user logged in 4 mins
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
  daysNotVerified: PropTypes.number,
  userUpdated: PropTypes.string,
};

RepoLastVerified.defaultProps = {
  site: {},
  daysNotVerified: 5,
  userUpdated: new Date().toISOString(),
};

export default RepoLastVerified;
