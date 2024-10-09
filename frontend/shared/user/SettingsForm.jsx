/* eslint-disable jsx-a11y/label-has-associated-control */
import React from 'react';
import PropTypes from 'prop-types';
import { Field, clearSubmitErrors, reduxForm } from 'redux-form';

import { ORGANIZATION, SITE } from '../../propTypes';

function SettingsForm(props) {
  const {
    error: errorMessage,
    handleSubmit,
    invalid,
    pristine,
    submitting,
    organizations,
    sites,
  } = props;

  return (
    <form onSubmit={handleSubmit}>
      <fieldset className="usa-fieldset margin-bottom-2">
        <legend className="usa-sr-only">Build Notification Settings</legend>
        <span className="usa-error-message" id="input-error-message" role="alert">
          {errorMessage}
        </span>
        <table className="usa-table usa-table--borderless usa-table--stacked log-table log-table__site-settings org-member-table width-full table-full-width">
          <thead>
            <tr>
              <th scope="col">Repository</th>
              <th scope="col">Organization</th>
              <th scope="col">Build Notifications</th>
            </tr>
          </thead>
          <tbody>
            {sites.map(site => (
              <tr key={site.id}>
                <th scope="row" data-title="Repository" className="font-body-sm">
                  {site.owner}
                  /
                  {site.repository}
                </th>
                <td data-title="Organization" className="font-body-sm">
                  {organizations.find(org => org.id === site.organizationId)?.name || '-'}
                </td>
                <td>
                  <div className="grid-row">
                    <div className="flex-1 usa-radio">
                      <Field
                        className="usa-radio__input"
                        component="input"
                        type="radio"
                        name={`buildNotificationSettings.${site.id}`}
                        id={`${site.id}-none`}
                        value="none"
                      />
                      <label className="usa-radio__label font-body-xs" htmlFor={`${site.id}-none`}>None</label>
                    </div>
                    <div className="flex-1 usa-radio">
                      <Field
                        className="usa-radio__input"
                        component="input"
                        type="radio"
                        name={`buildNotificationSettings.${site.id}`}
                        id={`${site.id}-builds`}
                        value="builds"
                      />
                      <label className="usa-radio__label font-body-xs" htmlFor={`${site.id}-builds`}>Only Mine</label>
                    </div>
                    <div className="flex-1 usa-radio">
                      <Field
                        className="usa-radio__input"
                        component="input"
                        type="radio"
                        name={`buildNotificationSettings.${site.id}`}
                        id={`${site.id}-site`}
                        value="site"
                      />
                      <label className="usa-radio__label font-body-xs" htmlFor={`${site.id}-site`}>All</label>
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <button
          type="submit"
          className="usa-button usa-button-primary margin-0"
          disabled={pristine || invalid || submitting}
        >
          Update
        </button>
      </fieldset>
    </form>
  );
}

SettingsForm.propTypes = {
  organizations: PropTypes.arrayOf(ORGANIZATION).isRequired,
  sites: PropTypes.arrayOf(SITE).isRequired,
  // the following props are from reduxForm:
  handleSubmit: PropTypes.func.isRequired,
  initialValues: PropTypes.shape({
    // eslint-disable-next-line react/forbid-prop-types
    buildNotificationSettings: PropTypes.object.isRequired,
  }).isRequired,
  invalid: PropTypes.bool.isRequired,
  pristine: PropTypes.bool.isRequired,
  submitting: PropTypes.bool.isRequired,
  error: PropTypes.string,
};

SettingsForm.defaultProps = {
  error: undefined,
};

export { SettingsForm };
export default reduxForm({
  form: 'user-settings',
  /* This is supposed to happen automatically... */
  onChange: (_, dispatch) => dispatch(clearSubmitErrors('user-settings')),
})(SettingsForm);
