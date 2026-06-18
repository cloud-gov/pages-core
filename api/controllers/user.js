const userSerializer = require('../serializers/user');
const { revokeApplicationGrant } = require('../services/GitHub');
const { revokeUserGitLabTokens } = require('../services/GitLabHelper');

module.exports = {
  me(req, res) {
    res.json(userSerializer.toJSON(req.user));
  },

  async revokeApplicationGrant(req, res) {
    const { user } = req;
    await revokeApplicationGrant(user);
    // even if the token revoke fails, we return a
    // 200 because we still want to prompt a reauth flow
    return res.json({});
  },

  async revokeUserGitLabTokens(req, res) {
    const { user } = req;

    await revokeUserGitLabTokens(user);

    return res.json({});
  },
};
