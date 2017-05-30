import PropTypes from 'prop-types';
import React from 'react';
import moment from "moment";

const propTypes = {
  site: PropTypes.shape({
    publishedAt: PropTypes.string,
  })
};

const getPublishedState = (site) => {
  if (site.publishedAt) {
    let formattedBuildTime = moment(site.publishedAt).format('MMMM Do YYYY, h:mm:ss a')
    return `This site was last published at ${formattedBuildTime}.`;
  } else {
    return 'Please wait for build to complete or check logs for error message.';
  }
};

const PublishedState = ({ site = {} }) =>
  <p>
    {getPublishedState(site)}
  </p>

PublishedState.propTypes = propTypes;

export default PublishedState;
