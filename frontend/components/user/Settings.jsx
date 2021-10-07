import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { error, success } from 'react-notification-system-redux';
import { SubmissionError } from 'redux-form';

import { ORGANIZATION, SITE, USER } from '../../propTypes';
import { userSettingsUpdated } from '../../actions/actionCreators/userActions';
import federalistApi from '../../util/federalistApi';
import LoadingIndicator from '../LoadingIndicator';
import SettingsForm from './SettingsForm';

function buildInitialValues(sites, user) {
  return {
    buildNotificationSettings: sites.reduce(
      (acc, site) => ({
        ...acc,
        [`${site.id}`]: user.buildNotificationSettings?.[site.id] || 'site',
      }),
      {}
    ),
  };
}

function Settings({
  actions, organizations, sites, user,
}) {
  if (sites?.isLoading || organizations?.isLoading || !sites || !organizations) {
    return <LoadingIndicator />;
  }

  const initialValues = buildInitialValues(sites.data, user);

  const onSubmit = userSettings => actions.updateUserSettings(userSettings)
    .catch((e) => { throw new SubmissionError({ _error: e.message }); });

  const onSubmitFail = (err, dispatch) => {
    dispatch(actions.error({
      message: 'Failed to update settings.',
      title: 'Error',
      position: 'tr',
      autoDismiss: 5,
    }));
  };

  const onSubmitSuccess = (updatedUser, dispatch) => {
    dispatch(actions.userSettingsUpdated(updatedUser));
    dispatch(actions.success({
      message: 'Successfully updated settings.',
      title: 'Success',
      position: 'tr',
      autoDismiss: 3,
    }));
  };

  return (
    <div>
      <div className="page-header usa-grid-full">
        <div className="usa-width-one-half">
          <h1>
            User Settings
          </h1>
        </div>
      </div>
      <div className="well">
        <h3>Build Notifications</h3>
        <SettingsForm
          initialValues={initialValues}
          organizations={organizations.data}
          sites={sites.data}
          onSubmit={onSubmit}
          onSubmitFail={onSubmitFail}
          onSubmitSuccess={onSubmitSuccess}
        />
      </div>
    </div>
  );
}

Settings.propTypes = {
  actions: PropTypes.shape({
    error: PropTypes.func.isRequired,
    success: PropTypes.func.isRequired,
    updateUserSettings: PropTypes.func.isRequired,
    userSettingsUpdated: PropTypes.func.isRequired,
  }),
  organizations: PropTypes.shape({
    data: PropTypes.arrayOf(ORGANIZATION),
    isLoading: PropTypes.bool,
  }),
  sites: PropTypes.shape({
    data: PropTypes.arrayOf(SITE),
    isLoading: PropTypes.bool,
  }),
  user: USER.isRequired,
};

Settings.defaultProps = {
  actions: {
    error,
    success,
    updateUserSettings: federalistApi.updateUserSettings,
    userSettingsUpdated,
  },
  organizations: null,
  sites: null,
};

const mapStateToProps = ({ organizations, sites, user }) => ({
  organizations,
  sites,
  user: user.data,
});

export { buildInitialValues, Settings, SettingsForm };
export default connect(mapStateToProps)(Settings);
