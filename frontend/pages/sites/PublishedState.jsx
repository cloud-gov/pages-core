import React from 'react';
import PropTypes from 'prop-types';
import { dateAndTime } from '@util/datetime';

const getPublishedState = ({ publishedAt }) =>
  publishedAt
    ? `Last published on ${dateAndTime(publishedAt)}.`
    : 'Please wait for build to complete or check logs for error message.';

const PublishedState = ({ site }) => <p>{getPublishedState(site)}</p>;

PublishedState.propTypes = {
  site: PropTypes.shape({
    publishedAt: PropTypes.string,
  }).isRequired,
};

export default PublishedState;
