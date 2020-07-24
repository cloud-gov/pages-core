/* eslint-disable scanjs-rules/call_addEventListener */
/* eslint-disable scanjs-rules/call_addEventListener_message */
/* global window */

const calcWindow = () => ({
  width: 600,
  height: 600,
  left: window.screen.width / 2 - 600 / 2,
  top: window.screen.height / 2 - 600 / 2,
});

const handleLogin = redirectBaseUrl => (callback) => {
  const {
    width, height, top, left,
  } = calcWindow();

  const authWindow = window.open(
    `${redirectBaseUrl}/admin/auth/github`,
    'Federalist Admin Auth',
    `width=${width}, height=${height}, top=${top}, left=${left}`
  );

  window.addEventListener('message', (e) => {
    if (e.origin === redirectBaseUrl && e.data === 'success') {
      authWindow.close();
      return callback(null, true);
    }
    return callback(new Error('Authentication failed'));
  }, { once: true });
  authWindow.focus();
};

export default handleLogin;
