import React from 'react';
import PropTypes from 'prop-types';

import api from '@util/federalistApi';

import globals from '../globals';
import { IconGitHub } from './icons';

const apiUrl = globals.APP_HOSTNAME;
const path = '/auth/github2';

const calcWindow = () => ({
  width: 800,
  height: 800,
  left: window.screen.width / 2 - 800 / 2,
  top: window.screen.height / 2 - 800 / 2,
});

function authorize(revokeFirst) {
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

  if (revokeFirst) {
    return api.revokeApplicationGrant().then(authPromise);
  }
  return authPromise();
}

const GithubAuthButton = ({ onFailure, onSuccess, text, revokeFirst = false }) => (
  <div className="bg-primary-lightest padding-2">
    <p className="usa-label margin-top-0">{text}</p>
    <button
      type="button"
      className="usa-button github-auth-button"
      onClick={() => authorize(revokeFirst).then(onSuccess).catch(onFailure)}
    >
      <IconGitHub /> Connect with GitHub
    </button>
  </div>
);

GithubAuthButton.propTypes = {
  onFailure: PropTypes.func.isRequired,
  onSuccess: PropTypes.func.isRequired,
  revokeFirst: PropTypes.bool,
  text: PropTypes.string.isRequired,
};

export default GithubAuthButton;
