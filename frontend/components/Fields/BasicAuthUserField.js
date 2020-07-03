import React from 'react';
import { Field } from 'redux-form';
import { validBasicAuthUsername } from '../../util/validators';
import InputWithErrorField from './InputWithErrorField';

export const validateBasicAuthUser = (value) => {
  if (value && value.length && !validBasicAuthUsername(value)) {
    return 'Username is invalid. Only alphanumeric characters are allowed. Minimum length 4 characters.';
  }

  return undefined;
};

const BasicAuthUserField = ({ ...props }) => (
  <Field
    component={InputWithErrorField}
    validate={[validateBasicAuthUser]}
    {...props}
  />
);

export default BasicAuthUserField;
