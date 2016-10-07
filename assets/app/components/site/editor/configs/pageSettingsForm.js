import React from 'react';
import build from '../../../../util/formBuilder';

const propTypes = {
  fields: React.PropTypes.array
};

const PageSettingsForm = ({ fields = [] }) =>
  <div className="usa-width-one-half">
    {fields.map((field, index) => {
      const { props } = field;

      return (
        <label key={index} htmlFor={props.name}>
          {props.name}
          {build(field)}
        </label>
      )
    })}
  </div>

PageSettingsForm.propTypes = propTypes;

export default PageSettingsForm;
