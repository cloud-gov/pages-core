import React from 'react';
import { Field } from 'redux-form';
import { validBasicAuthUser } from '../../util/validators';
import InputWithErrorField from './InputWithErrorField';

export const validateBasicAuthUser = (value) => {
  if (value && value.length && !validBasicAuthUserName(value)) {
    return 'Username contains invalid characters. Alphanumeric characters are allowed';
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
