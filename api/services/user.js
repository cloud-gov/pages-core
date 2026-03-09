module.exports = {
  async updateGitLabTokens(user, { accessToken, refreshToken, expiresIn, createdAt }) {
    return user.update({
      gitlabToken: accessToken,
      gitlabRefreshToken: refreshToken,
      gitlabExpiresAt: new Date((createdAt + expiresIn) * 1000),
    });
  },

  async resetGitLabTokens(user) {
    return user.update({
      gitlabToken: null,
      gitlabRefreshToken: null,
      gitlabExpiresAt: null,
    });
  },
};
