import React, { useRef } from 'react';
import PropTypes from 'prop-types';
import globals from '../globals';
import { IconGitLabWhite } from './icons';
import api from '@util/federalistApi';

const apiUrl = globals.APP_HOSTNAME;
const path = '/auth/gitlab';

const CLICK_DEBOUNCE_MS = 1000;

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

      authWindow?.focus();
    });

  if (revokeFirst) {
    return api.revokeUserGitLabTokens().then(authPromise);
  }

  return authPromise();
}

const GitLabAuthButton = ({ onFailure, onSuccess, text, revokeFirst = false }) => {
  const isProcessing = useRef(false);

  return (
    <>
      <div className="bg-primary-lightest padding-2">
        <p className="usa-label margin-top-0">{text}</p>
        <button
          type="button"
          className="usa-button gitlab-auth-button"
          onClick={() => {
            if (isProcessing.current) return;
            isProcessing.current = true;
            setTimeout(() => {
              isProcessing.current = false;
            }, CLICK_DEBOUNCE_MS);
            authorize(revokeFirst).then(onSuccess).catch(onFailure);
          }}
        >
          <IconGitLabWhite /> Connect with GitLab
        </button>
      </div>
    </>
  );
};
GitLabAuthButton.propTypes = {
  onFailure: PropTypes.func.isRequired,
  onSuccess: PropTypes.func.isRequired,
  revokeFirst: PropTypes.bool,
  text: PropTypes.string.isRequired,
};

export default GitLabAuthButton;
