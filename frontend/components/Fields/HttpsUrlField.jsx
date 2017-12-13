import React from 'react';
import { Field } from 'redux-form';
import { isURL } from 'validator';

import RenderUrlField from './RenderUrlField';


export const isHttpsUrlWithoutPath = (value) => {
  if (value && value.length) {
    if (!isURL(value, { protocols: ['https'] }) || value.lastIndexOf('/') !== 7) {
      return 'Please enter a URL that starts with "https://" and has no trailing path';
    }
  }

  return undefined;
};

const HttpsUrlField = ({ ...props }) => (
  <Field
    component={RenderUrlField}
    validate={[isHttpsUrlWithoutPath]}
    {...props}
  />
);

export default HttpsUrlField;
