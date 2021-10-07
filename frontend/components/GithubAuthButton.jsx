/* global window */
/* eslint-disable scanjs-rules/call_addEventListener */
/* eslint-disable scanjs-rules/call_addEventListener_message */
import React from 'react';
import PropTypes from 'prop-types';

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

function authorize() {
  return new Promise((resolve, reject) => {
    const url = `${apiUrl}${path}`;

    const {
      width, height, top, left,
    } = calcWindow();

    const opts = `resizable=yes,scrollbars=yes,width=${width},height=${height},top=${top},left=${left}`;

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
}

const GithubAuthButton = ({ onFailure, onSuccess }) => (
  <div className="well-gray-lightest">
    <p>Sign in to your Github account to add sites to the platform.</p>
    <button
      type="button"
      className="usa-button github-auth-button"
      onClick={
        () => authorize()
          .then(onSuccess)
          .catch(onFailure)
      }
    >
      <IconGitHub />
      {' '}
      Connect with Github
    </button>
  </div>
);

GithubAuthButton.propTypes = {
  onFailure: PropTypes.func,
  onSuccess: PropTypes.func,
};

GithubAuthButton.defaultProps = {
  onFailure: () => {},
  onSuccess: () => {},
};

export default GithubAuthButton;
