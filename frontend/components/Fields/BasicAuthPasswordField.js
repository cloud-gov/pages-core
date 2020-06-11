import React from 'react';
import { Field } from 'redux-form';
import { validBasicAuthPassword } from '../../util/validators';
import InputWithErrorField from './InputWithErrorField';

export const validateBasicAuthPassword = (value) => {
  if (value && value.length && !validBasicAuthUserName(value)) {
    return 'Password may contain alphanumeric characters symbols !@$';
  }

  return undefined;
};

const BasicAuthPasswordField = ({ ...props }) => (
  <Field
    component={InputWithErrorField}
    validate={[validateBasicAuthPassword]}
    {...props}
  />
);

export default BasicAuthPasswordField;
