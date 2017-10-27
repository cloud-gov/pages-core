import React from 'react';
import PropTypes from 'prop-types';
import { Field } from 'redux-form';
import RenderField from './RenderField';

const githubUrlRegex = /^https:\/\/github\.com\/[a-zA-Z0-9_-]{2,}\/[a-zA-Z0-9_-]{2,}$/;

export const required = value => (value && value.length ? undefined : 'Required');
export const githubRepoUrl = (value) => {
  if (!githubUrlRegex.test(value)) {
    return 'URL is not formatted correctly';
  }
  return undefined;
};

const GitHubRepoUrlField = ({ id, ...props }) => (
  <Field
    id={id}
    component={RenderField}
    validate={[required, githubRepoUrl]}
    {...props}
  />
);

const propTypes = {
  id: PropTypes.string.isRequired,
};

GitHubRepoUrlField.propTypes = propTypes;

export default GitHubRepoUrlField;
