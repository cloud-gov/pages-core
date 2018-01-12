import React from 'react';
import PropTypes from 'prop-types';
import { Field } from 'redux-form';

const validBranchRegex = /^[^\/|\.]+(?!.*\.{2}|.*\/{2}|^@$|.*@\{)+(?!([\.lock|[\.\/]])).|^$/;

const invalidPrefix = /^[^\/|\.]+/;
const invalidChars = /(?!.*\.{2}|.*\/{2}|^@$|.*@\{)/;
const invalidSuffix = /[^\.lock|\.|\/]$/;

//new RegExp('^[^\/|.](?!.*\.{2}|.*\/{2}|^@$|.*@\{)[^\x00-\x1F\x7F\s<>~^:?*[\\]+(?<!\.lock|\.|\/)$');

export const validateBranchName = (value) => {
  if (value && value.length && !validBranchRegex.test(value)) {
    return 'Branch name contains invalid characters.';
  }
  return undefined;
};

const BranchField = ({ ...props }) =>
  <Field
    validate={[validateBranchName]}
    {...props}
  />;

export default BranchField;
