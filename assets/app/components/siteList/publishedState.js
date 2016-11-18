import React from 'react';
import moment from "moment";

const propTypes = {
  builds: React.PropTypes.array
};

const getLastBuildTime = (builds) => {
  let sorted = builds.sort((a, b) => {
    let aCompletedAt = new Date(a.completedAt);
    let bCompletedAt = new Date(b.completedAt);
    return aCompletedAt > bCompletedAt;
  });
  let last = sorted.pop();

  return moment(last.completedAt).format('MMMM Do YYYY, h:mm:ss a') || 'forever ago';
};

const getPublishedState = (builds) => {
  if (builds.length) {
    return `This site was last published at ${getLastBuildTime(builds)}`;
  }

  return 'This site has not been published yet. Please wait while the site is built.';
};

const PublishedState = ({ builds = [] }) =>
  <p>
    {getPublishedState(builds)}
  </p>

PublishedState.propTypes = propTypes;

export default PublishedState;
