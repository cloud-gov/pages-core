module.exports = {
  async updateGitLabTokens(
    user,
    { accessToken, refreshToken, expiresIn, createdAt, gitlabUserId },
  ) {
    return user.update({
      gitlabToken: accessToken,
      gitlabRefreshToken: refreshToken,
      gitlabExpiresAt:
        accessToken && refreshToken ? new Date((createdAt + expiresIn) * 1000) : null,
      gitlabUserId: gitlabUserId ?? user.gitlabUserId,
    });
  },

  async resetGitLabTokens(user) {
    return user.update({
      gitlabToken: null,
      gitlabRefreshToken: null,
      gitlabExpiresAt: null,
      gitlabUserId: null,
    });
  },
};
