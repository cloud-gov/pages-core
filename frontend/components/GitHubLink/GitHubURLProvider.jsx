import React from 'react';
import PropTypes from 'prop-types';

const propTypes = {
  Dog: PropTypes.instanceOf(React.Component)
};
const base = 'https://github.com';
const GitHubURLProvider = Component => {
  return ({owner, repository, ...props}) => {
    const baseHref = `${base}/${owner}/${repository}`;

    return <Component baseHref={baseHref} {...props} />;
  };
};

export default GitHubURLProvider;
