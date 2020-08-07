const cookieLib = require('cookie');

const sessionConfig = require('../../../api/init/sessionConfig');

const sessionCookieFromResponse = (response, sid = 'federalist.sid') => {
  const header = response.headers['set-cookie'][0];
  const parsedHeader = cookieLib.parse(header);
  const sess = parsedHeader[sid].replace('s:', '');
  return sess.split('.')[0];
};

const sessionForCookie = (cookie, sid = 'federalist.sid') => {
  const sessionID = cookie.replace(`${sid}=s%3A`, '').split('.')[0];
  return new Promise((resolve, reject) => {
    sessionConfig.store.get(sessionID, (err, sessionBody) => {
      if (err) {
        reject(err);
      } else {
        resolve(sessionBody);
      }
    });
  });
};

module.exports = {
  sessionCookieFromResponse,
  sessionForCookie,
};
