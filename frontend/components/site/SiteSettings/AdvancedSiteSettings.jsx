
import React from 'react';
import PropTypes from 'prop-types';
import { Field, reduxForm } from 'redux-form';

import SelectSiteEngine from '../../SelectSiteEngine';

const propTypes = {
  onDelete: PropTypes.func.isRequired,

  // initialValues is what the initial form values are based on
  initialValues: PropTypes.shape({
    engine: PropTypes.string.isRequired,
    config: PropTypes.string,
    demoConfig: PropTypes.string,
    previewConfig: PropTypes.string,
  }).isRequired,

  // the following props are from reduxForm:
  handleSubmit: PropTypes.func.isRequired,
  reset: PropTypes.func.isRequired,
  pristine: PropTypes.bool.isRequired,
};


export const AdvancedSiteSettings = ({
  // even though initialValues is not directly used, it is used
  // by reduxForm, and we want PropType validation on it, so we'll
  // keep it here but disable the eslint rule below
  initialValues, // eslint-disable-line no-unused-vars
  onDelete,
  reset,
  pristine,
  handleSubmit,
}) => (
  <form className="settings-form settings-form-advanced" onSubmit={handleSubmit}>
    <div className="usa-grid">
      <div className="usa-width-one-whole">
        <label htmlFor="engine">Static site engine</label>
        <Field
          name="engine"
          id="engine"
          component={p =>
            <SelectSiteEngine
              value={p.input.value}
              onChange={p.input.onChange}
              className="form-control"
            />
          }
        />
      </div>
    </div>

    {/* CUSTOM CONFIG */}
    <div className="usa-grid">
      <div className="usa-width-one-whole">
        <div className="well">
          <h3 className="well-heading">Site configuration</h3>
          <p className="well-text">
            Add additional configuration in yaml to be added to your <code>_config.yml</code> file when we build your site&apos;s primary branch.
          </p>
          <Field
            component="textarea"
            name="config"
            className="form-control"
          />
        </div>
      </div>
    </div>

    {/* DEMO CONFIG */}
    <div className="usa-grid">
      <div className="usa-width-one-whole">
        <div className="well">
          <h3 className="well-heading">Demo configuration</h3>
          <p className="well-text">
            Add additional configuration in yaml to be added to your <code>_config.yml</code> file when we build your site&apos;s demo branch.
          </p>
          <Field
            component="textarea"
            name="demoConfig"
            className="form-control"
          />
        </div>
      </div>
    </div>

    {/* PREVIEW CONFIG */}
    <div className="usa-grid">
      <div className="usa-width-one-whole">
        <div className="well">
          <h3 className="well-heading">Preview configuration</h3>
          <p className="well-text">
            Add additional configuration in yaml to be added to your <code>_config.yml</code> file when we build a preview branch for your site.
          </p>
          <Field
            component="textarea"
            name="previewConfig"
            className="form-control"
          />
        </div>
      </div>
    </div>

    <div className="usa-grid">
      <div className="usa-width-one-whole">
        <button
          type="button"
          className="usa-button usa-button-gray button-reset"
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
          Save Advanced Settings
        </button>
      </div>
    </div>

    <div className="usa-grid">
      <h3>Danger Zone</h3>
      <div className="usa-alert usa-alert-delete" role="alert">
        Delete this site from Federalist?
        <button
          className="usa-button usa-button-secondary button-delete"
          onClick={onDelete}
        >
          Delete
        </button>
      </div>
    </div>
  </form>
);


AdvancedSiteSettings.propTypes = propTypes;

// create a higher-order component with reduxForm and export that
export default reduxForm({ form: 'advancedSiteSettings' })(AdvancedSiteSettings);
