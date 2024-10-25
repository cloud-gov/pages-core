import React from 'react';
import PropTypes from 'prop-types';
import { Field, reduxForm } from 'redux-form';

import SelectSiteEngine from '@shared/SelectSiteEngine';

export const AdvancedSiteSettingsForm = ({
  // even though initialValues is not directly used, it is used
  // by reduxForm, and we want PropType validation on it, so we'll
  // keep it here but disable the eslint rule below
  initialValues, // eslint-disable-line no-unused-vars
  reset,
  pristine,
  handleSubmit,
}) => (
  <form
    className="settings-form settings-form-advanced"
    onSubmit={handleSubmit}
  >
    <div className="well">
      <label className="usa-sr-only" htmlFor="engine">Site engine</label>
      <Field
        name="engine"
        component={p => (
          <SelectSiteEngine
            name="engine"
            id="engine"
            value={p.input.value}
            onChange={p.input.onChange}
          />
        )}
      />
      <div className="usa-button-group margin-y-2 margin-x-0">
        <button
          type="button"
          className="usa-button usa-button--outline"
          disabled={pristine}
          onClick={reset}
        >
          Reset
        </button>

        <button
          type="submit"
          className="usa-button usa-button--primary"
          disabled={pristine}
        >
          Save advanced settings
        </button>
      </div>
    </div>
  </form>
);

AdvancedSiteSettingsForm.propTypes = {
  // initialValues is what the initial form values are based on
  initialValues: PropTypes.shape({
    engine: PropTypes.string.isRequired,
  }).isRequired,

  // the following props are from reduxForm:
  handleSubmit: PropTypes.func.isRequired,
  reset: PropTypes.func.isRequired,
  pristine: PropTypes.bool.isRequired,
};

// create a higher-order component with reduxForm and export that
export default reduxForm({ form: 'advancedSiteSettings' })(
  AdvancedSiteSettingsForm
);
