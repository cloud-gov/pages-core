import React from 'react';
import { Field } from 'redux-form';
import InputWithErrorField from './InputWithErrorField';

const invalidPrefix = /^[/|.]/;
const invalidChars = /(.*\.{2}|.*\/{2}|^@$|.*@\{|[\s<>~^:?[\\])/;
const invalidSuffix = /(\.lock|\.|\/)$/;

const validations = [invalidPrefix, invalidChars, invalidSuffix];

const validate = string =>
  validations.some(validation => validation.test(string));

export const validateBranchName = (value) => {
  if (value && value.length && !!validate(value)) {
    return 'Branch name contains invalid characters.';
  }

  return undefined;
};

const BranchField = ({ ...props }) =>
  <Field
    component={InputWithErrorField}
    validate={[validateBranchName]}
    {...props}
  />;

export default BranchField;
