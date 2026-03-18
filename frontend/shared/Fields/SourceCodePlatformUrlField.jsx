import React from 'react';
import { Field } from 'redux-form';
import InputWithErrorField from './InputWithErrorField';

const githubUrlRegex = /^https:\/\/github\.com\/[a-zA-Z0-9._-]{2,}\/[a-zA-Z0-9._-]{2,}$/;
const gitLabUrlRegExp = /^(https?:\/\/[^/]+)(?:\/[a-zA-Z0-9._-]+)*$/;

export const sourceCodePlatformUrl = (value) => {
  const githubValidation = githubUrlRegex.test(value);
  const gitlabValidation =
    process.env.FEATURE_WORKSHOP_INTEGRATION === 'true'
      ? gitLabUrlRegExp.test(value)
      : false;
  if (value && value.length && !(githubValidation || gitlabValidation)) {
    return 'URL is not formatted correctly';
  }
  return undefined;
};

const SourceCodePlatformUrlField = ({ ...props }) => (
  <>
    <Field
      component={InputWithErrorField}
      validate={[sourceCodePlatformUrl]}
      {...props}
    />
    {process.env.FEATURE_WORKSHOP_INTEGRATION === 'true' ? (
      <>
        <div>
          <small>GitHub example: https://github.com/owner/repository.</small>
        </div>
        <div>
          <small>
            Workshop example: https://workshop.cloud.gov/group/project or
            https://workshop.cloud.gov/group/subgroup/project.
          </small>
        </div>
      </>
    ) : null}
  </>
);

export default SourceCodePlatformUrlField;
