import React from 'react';

import { dateAndTime } from '../../util/datetime';

const getPublishedState = (site) => {
  if (site.publishedAt) {
    const formattedBuildTime = dateAndTime(site.publishedAt);
    return `Last published on ${formattedBuildTime}.`;
  }
  return 'Please wait for build to complete or check logs for error message.';
};

const PublishedState = ({ site = {} }) =>
  <p>
    {getPublishedState(site)}
  </p>;

PublishedState.propTypes = {
  site: React.PropTypes.shape({
    publishedAt: React.PropTypes.string,
  }),
};

PublishedState.defaultProps = {
  site: {},
};

export default PublishedState;
