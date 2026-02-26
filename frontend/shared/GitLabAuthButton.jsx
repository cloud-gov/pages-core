import React from 'react';
import PropTypes from 'prop-types';

import globals from '../globals';
import { IconGitLab } from './icons';

const apiUrl = globals.APP_HOSTNAME;
const path = '/auth/gitlab';

const calcWindow = () => ({
  width: 800,
  height: 800,
  left: window.screen.width / 2 - 800 / 2,
  top: window.screen.height / 2 - 800 / 2,
});

function authorize() {
  const authPromise = () =>
    new Promise((resolve, reject) => {
      const url = `${apiUrl}${path}`;

      const { width, height, top, left } = calcWindow();

      const opts = `
        resizable=yes,
        scrollbars=yes,
        width=${width},
        height=${height},
        top=${top},
        left=${left}
      `;

      const authWindow = window.open(url, 'authWindow', opts);

      const handleMessage = (e) => {
        if (e.origin === apiUrl && e.data === 'success') {
          authWindow.close();
          return resolve(true);
        }
        return reject(new Error('Authentication failed'));
      };

      window.addEventListener('message', handleMessage, { once: true });

      authWindow.focus();
    });

  return authPromise();
}

const GitLabAuthButton = ({ onFailure, onSuccess, text }) => (
  <div className="bg-primary-lightest padding-2">
    <p className="usa-label margin-top-0">{text}</p>
    <button
      type="button"
      className="usa-button gitlab-auth-button"
      onClick={() => authorize().then(onSuccess).catch(onFailure)}
    >
      <IconGitLab /> Connect with GitLab
    </button>
  </div>
);

GitLabAuthButton.propTypes = {
  onFailure: PropTypes.func.isRequired,
  onSuccess: PropTypes.func.isRequired,
  revokeFirst: PropTypes.bool,
  text: PropTypes.string.isRequired,
};

export default GitLabAuthButton;
