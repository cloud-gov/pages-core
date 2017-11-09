import React from 'react';
import PropTypes from 'prop-types';
import { Field } from 'redux-form';
import RenderField from './RenderField';

const githubUrlRegex = /^https:\/\/github\.com\/[a-zA-Z0-9._-]{2,}\/[a-zA-Z0-9._-]{2,}$/;

export const githubRepoUrl = (value) => {
  if (value && value.length && !githubUrlRegex.test(value)) {
    return 'URL is not formatted correctly';
  }
  return undefined;
};

const GitHubRepoUrlField = ({ id, ...props }) => (
  <Field
    id={id}
    component={RenderField}
    validate={[githubRepoUrl]}
    {...props}
  />
);

const propTypes = {
  id: PropTypes.string.isRequired,
};

GitHubRepoUrlField.propTypes = propTypes;

export default GitHubRepoUrlField;
