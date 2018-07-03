
import React from 'react';
import PropTypes from 'prop-types';
import { Field, reduxForm } from 'redux-form';

import SelectSiteEngine from '../../SelectSiteEngine';
import AlertBanner from '../../alertBanner';

export const AdvancedSiteSettings = ({
  // even though initialValues is not directly used, it is used
  // by reduxForm, and we want PropType validation on it, so we'll
  // keep it here but disable the eslint rule below
  siteId,
  initialValues, // eslint-disable-line no-unused-vars
  onDelete,
  reset,
  pristine,
  handleSubmit,
}) => (
  <form className="settings-form settings-form-advanced" onSubmit={handleSubmit}>
    <div className="well">
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
    <div className="well">
      {/* CUSTOM CONFIG */}
      <fieldset>
        <legend>Live site</legend>
        <p className="well-text">
          Add additional configuration in yaml to be added to your
          {' '}
          <code>_config.yml</code> file when we build your site&apos;s primary branch.
        </p>
        <label htmlFor="config">Site configuration</label>
        <Field
          component="textarea"
          name="config"
          className="form-control-mono"
        />
      </fieldset>
    </div>
    <div className="well">
      {/* DEMO CONFIG */}
      <fieldset>
        <legend>Demo site</legend>
        <p className="well-text">
          Add additional configuration in yaml to be added to your
          {' '}
          <code>_config.yml</code> file when we build your site&apos;s demo branch.
        </p>
        <label htmlFor="demoConfig">Demo configuration</label>
        <Field
          component="textarea"
          name="demoConfig"
          className="form-control-mono"
        />
      </fieldset>
    </div>
    <div className="well">
      {/* PREVIEW CONFIG */}
      <fieldset>
        <legend>Preview site</legend>
        <p className="well-text">
          Add additional configuration in yaml to be added to your
          {' '}
          <code>_config.yml</code> file when we build a preview branch for your site.
        </p>
        <label htmlFor="previewConfig">Preview configuration</label>
        <Field
          component="textarea"
          name="previewConfig"
          className="form-control-mono"
        />
      </fieldset>
    </div>
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

    <div className="well">
      {/* DELETE SITE */}
      <fieldset>
        <legend>Delete Site</legend>
        <p className="well-text">
          Deleting a Federalist site removes the published site from our servers and
          disconnects the Federalist admin interface for all users. This will bring the
          entire site offline and make it inaccessible for users. <i>Trying to remove a site
          from your list of Federalist sites? Go to the
          {' '}
            <a href={`/sites/${siteId}/users`}>collaborators page</a> and remove yourself.</i>
        </p>
        <AlertBanner
          status="warning"
          header="Danger zone"
          message="Are you sure you want to delete this site from Federalist for all users,
                   remove all published sites, and delete all previews?"
          alertRole={false}
        >
          <button className="usa-button usa-button-red" onClick={onDelete}>
            Delete
          </button>
        </AlertBanner>
      </fieldset>
    </div>
  </form>
);

AdvancedSiteSettings.propTypes = {
  onDelete: PropTypes.func.isRequired,
  siteId: PropTypes.number.isRequired,
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

// create a higher-order component with reduxForm and export that
export default reduxForm({ form: 'advancedSiteSettings' })(AdvancedSiteSettings);
