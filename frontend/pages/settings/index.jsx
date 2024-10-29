import React from 'react';
import { useSelector } from 'react-redux';
import { error, success } from 'react-notification-system-redux';
import { SubmissionError } from 'redux-form';

import { userSettingsUpdated } from '@actions/actionCreators/userActions';
import federalistApi from '@util/federalistApi';
import LoadingIndicator from '@shared/LoadingIndicator';
import GithubAuthButton from '@shared/GithubAuthButton';
import userActions from '@actions/userActions';
import alertActions from '@actions/alertActions';
import notificationActions from '@actions/notificationActions';

import SettingsForm from './SettingsForm';

function buildInitialValues(sites, user) {
  return {
    buildNotificationSettings: sites.reduce(
      (acc, site) => ({
        ...acc,
        [`${site.id}`]: user.buildNotificationSettings?.[site.id] || 'site',
      }),
      {},
    ),
  };
}

const onGithubAuthSuccess = () => {
  userActions.fetchUser();
  alertActions.alertSuccess('Github authorization successful');
  notificationActions.success('Github authorization successful');
};

const onGithubAuthFailure = (_error) => {
  alertActions.alertError(_error.message);
};

function UserSettings() {
  const organizations = useSelector((state) => state.organizations);
  const sites = useSelector((state) => state.sites);
  const user = useSelector((state) => state.user.data);

  if (
    sites?.isLoading ||
    organizations?.isLoading ||
    !sites ||
    !sites.data ||
    !organizations
  ) {
    return <LoadingIndicator />;
  }

  const initialValues = buildInitialValues(sites.data, user);

  const onSubmit = (userSettings) =>
    federalistApi.updateUserSettings(userSettings).catch((e) => {
      throw new SubmissionError({
        _error: e.message,
      });
    });

  const onSubmitFail = (err, dispatch) => {
    dispatch(
      error({
        message: 'Failed to update settings.',
        title: 'Error',
        position: 'tr',
        autoDismiss: 5,
      }),
    );
  };

  const onSubmitSuccess = (updatedUser, dispatch) => {
    dispatch(userSettingsUpdated(updatedUser));
    dispatch(
      success({
        message: 'Successfully updated settings.',
        title: 'Success',
        position: 'tr',
        autoDismiss: 3,
      }),
    );
  };

  return (
    <div className="user-settings">
      <div className="page-header grid-row">
        <div className="grid-col">
          <h1 className="font-sans-2xl">User Settings</h1>
        </div>
      </div>
      <div className="well grid-row">
        <div className="grid-col">
          <h2>Github Token</h2>
        </div>
      </div>
      <div className="well grid-row">
        <div className="grid-col">
          <GithubAuthButton
            onSuccess={onGithubAuthSuccess}
            onFailure={onGithubAuthFailure}
            text="Reset your Github Access Token."
            revokeFirst
          />
        </div>
      </div>
      <div className="well grid-row">
        <div className="grid-col">
          <h2 className="margin-top-5 margin-bottom-0">Build Notifications</h2>
        </div>
      </div>
      <div className="well grid-row">
        <div className="grid-col">
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
    </div>
  );
}

export { buildInitialValues, UserSettings };
export default UserSettings;
