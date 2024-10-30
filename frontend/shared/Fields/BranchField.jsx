import React from 'react';
import { Field } from 'redux-form';
import { validBranchName } from '@util/validators';
import InputWithErrorField from './InputWithErrorField';

export const validateBranchName = (value) => {
  if (value && value.length && !validBranchName(value)) {
    return 'Branch name contains invalid characters.';
  }

  return undefined;
};

const BranchField = ({ ...props }) => (
  <Field component={InputWithErrorField} validate={[validateBranchName]} {...props} />
);

export default BranchField;
