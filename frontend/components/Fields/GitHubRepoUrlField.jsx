import React from 'react';
import { Field } from 'redux-form';
import RenderUrlField from './RenderUrlField';

const githubUrlRegex = /^https:\/\/github\.com\/[a-zA-Z0-9._-]{2,}\/[a-zA-Z0-9._-]{2,}$/;

export const githubRepoUrl = (value) => {
  if (value && value.length && !githubUrlRegex.test(value)) {
    return 'URL is not formatted correctly';
  }
  return undefined;
};

const GitHubRepoUrlField = ({ ...props }) => (
  <Field
    component={RenderUrlField}
    validate={[githubRepoUrl]}
    {...props}
  />
);

export default GitHubRepoUrlField;
