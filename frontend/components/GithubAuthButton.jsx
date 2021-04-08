/* global window, APP_HOSTNAME */
/* eslint-disable scanjs-rules/call_addEventListener */
/* eslint-disable scanjs-rules/call_addEventListener_message */
import React from 'react';
import PropTypes from 'prop-types';
import { IconGitHub } from './icons';

const apiUrl = APP_HOSTNAME;
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
