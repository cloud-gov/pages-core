import React from 'react';
import PropTypes from 'prop-types';
import { Field, reduxForm } from 'redux-form';

import SelectSiteEngine from '../../SelectSiteEngine';

export const AdvancedSiteSettingsForm = ({
  // even though initialValues is not directly used, it is used
  // by reduxForm, and we want PropType validation on it, so we'll
  // keep it here but disable the eslint rule below
  initialValues, // eslint-disable-line no-unused-vars
  reset,
  pristine,
  handleSubmit,
}) => (
  <form className="settings-form settings-form-advanced" onSubmit={handleSubmit}>
    <div className="well">
      {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
      <label htmlFor="engine">Site engine</label>
      <Field
        name="engine"
        component={p => (
          <SelectSiteEngine
            name="engine"
            id="engine"
            value={p.input.value}
            onChange={p.input.onChange}
            className="form-control"
          />
        )}
      />
    </div>
    {
      initialValues.defaultConfig
      && (
      <div className="well">
        {/* CUSTOM CONFIG */}
        <fieldset>
          <legend>Live site</legend>
          <p className="well-text">
            Add additional configuration in yaml to be added to your
            {' '}
            <code>_config.yml</code>
            {' '}
            file when we build your site&apos;s primary branch.
          </p>
          {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
          <label htmlFor="defaultConfig">Site configuration</label>
          <Field
            component="textarea"
            name="defaultConfig"
            id="defaultConfig"
            className="form-control-mono"
          />
        </fieldset>
      </div>
      )
    }
    {
      initialValues.demoConfig
      && (
      <div className="well">
        {/* DEMO CONFIG */}
        <fieldset>
          <legend>Demo site</legend>
          <p className="well-text">
            Add additional configuration in yaml to be added to your
            {' '}
            <code>_config.yml</code>
            {' '}
            file when we build your site&apos;s demo branch.
          </p>
          {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
          <label htmlFor="demoConfig">Demo configuration</label>
          <Field
            component="textarea"
            name="demoConfig"
            id="demoConfig"
            className="form-control-mono"
          />
        </fieldset>
      </div>
      )
    }
    {
      initialValues.previewConfig
      && (
      <div className="well">
        {/* PREVIEW CONFIG */}
        <fieldset>
          <legend>Preview site</legend>
          <p className="well-text">
            Add additional configuration in yaml to be added to your
            {' '}
            <code>_config.yml</code>
            {' '}
            file when we build a preview branch for your site.
          </p>
          {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
          <label htmlFor="previewConfig">Preview configuration</label>
          <Field
            component="textarea"
            name="previewConfig"
            id="previewConfig"
            className="form-control-mono"
          />
        </fieldset>
      </div>
      )
    }
    <button
      type="button"
      className="usa-button usa-button-secondary"
      disabled={pristine}
      onClick={reset}
    >
      Reset
    </button>

    <button
      type="submit"
      className="usa-button usa-button-primary"
      disabled={pristine}
    >
      Save advanced settings
    </button>
  </form>
);

AdvancedSiteSettingsForm.propTypes = {
  // initialValues is what the initial form values are based on
  initialValues: PropTypes.shape({
    engine: PropTypes.string.isRequired,
    defaultConfig: PropTypes.string,
    demoConfig: PropTypes.string,
    previewConfig: PropTypes.string,
  }).isRequired,

  // the following props are from reduxForm:
  handleSubmit: PropTypes.func.isRequired,
  reset: PropTypes.func.isRequired,
  pristine: PropTypes.bool.isRequired,
};

// create a higher-order component with reduxForm and export that
export default reduxForm({ form: 'advancedSiteSettings' })(AdvancedSiteSettingsForm);
