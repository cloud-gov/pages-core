import React from 'react';
import { useSelector } from 'react-redux';

import userActions from '@actions/userActions';
import alertActions from '@actions/alertActions';
import notificationActions from '@actions/notificationActions';
import LoadingIndicator from '@shared/LoadingIndicator';
import GithubAuthButton from '@shared/GithubAuthButton';
import GitLabAuthButton from '@shared/GitLabAuthButton';

const onGitProviderAuthSuccess = (gitProviderName) => {
  userActions.fetchUser();
  alertActions.alertSuccess(`${gitProviderName} authorization successful`);
  notificationActions.success(`${gitProviderName} authorization successful`);
};

const onGithubAuthSuccess = () => {
  onGitProviderAuthSuccess('GitHub');
};

const onGitLabAuthSuccess = () => {
  onGitProviderAuthSuccess('GitLab');
};

const onGitProviderAuthFailure = (_error) => {
  alertActions.alertError(_error.message);
};

function UserSettings() {
  const user = useSelector((state) => state.user.data);

  if (!user) {
    return <LoadingIndicator />;
  }

  return (
    <div className="user-settings">
      <div className="page-header grid-row">
        <div className="grid-col">
          <h1 className="font-sans-2xl">User Settings</h1>
        </div>
      </div>
      <div className="well grid-row">
        <div className="grid-col">
          <h2>GitHub Token</h2>
        </div>
      </div>
      <div className="well grid-row">
        <div className="grid-col">
          <GithubAuthButton
            onSuccess={onGithubAuthSuccess}
            onFailure={onGitProviderAuthFailure}
            text="Reset your Github Access Token."
            revokeFirst
          />
        </div>
      </div>
      {process.env.FEATURE_WORKSHOP_INTEGRATION === 'true' ? (
        <>
          <div className="well grid-row">
            <div className="grid-col">
              <h2>GitLab Token</h2>
            </div>
          </div>

          <div className="well grid-row">
            <div className="grid-col">
              <GitLabAuthButton
                onSuccess={onGitLabAuthSuccess}
                onFailure={onGitProviderAuthFailure}
                text="Reset your GitLab Access Token."
                revokeFirst
              />
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

export { UserSettings };
export default UserSettings;
