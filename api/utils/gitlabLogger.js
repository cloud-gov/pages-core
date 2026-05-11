const { logger } = require('../../winston');

const gitlabLogError = (error, message) => {
  logger.error(
    [`GitLab error: ${message}`, error.message, error.stack]
      .filter(Boolean)
      .map((s) => (s.endsWith('.') ? s : `${s}.`))
      .join('\n'),
  );
};

const gitlabLogResponseError = async (user, response, message) => {
  const data = await response.json();

  const error = new Error(message);

  gitlabLogError(
    error,
    `GitLab error: ${message}, user ${gitlabLogUserInfo(user)}, 
              response: ${response.status} - ${JSON.stringify(data)}`,
  );

  return error;
};

const gitlabLogUserInfo = (user) =>
  // eslint-disable-next-line max-len
  ` user (id=${user?.id}, username=${user?.username}, gitlabExpiresAt=${user?.gitlabExpiresAt}, now=${new Date()}) )`;

module.exports = {
  gitlabLogError,
  gitlabLogResponseError,
  gitlabLogUserInfo,
};
