const Ajv = require('ajv');
const userSerializer = require('../serializers/user');
const { revokeApplicationGrant } = require('../services/GitHub');

const ajv = new Ajv();

const updateSettingsBodySchema = {
  type: 'object',
  properties: {
    buildNotificationSettings: {
      type: 'object',
      patternProperties: {
        '^\\d+$': {
          enum: ['none', 'builds', 'site'],
        },
      },
    },
  },
  required: ['buildNotificationSettings'],
  additionalProperties: false,
};

const validateUpdateSettingsBody = ajv.compile(updateSettingsBodySchema);

module.exports = {
  me(req, res) {
    res.json(userSerializer.toJSON(req.user));
  },

  async updateSettings(req, res) {
    const { body, user } = req;

    if (!validateUpdateSettingsBody(body)) {
      const message = validateUpdateSettingsBody.errors.map((e) => e.message).join('\n');
      return res.badRequest({
        message,
      });
    }

    const { buildNotificationSettings } = body;

    await user.update({
      buildNotificationSettings,
    });

    return res.json(userSerializer.serialize(user));
  },

  async revokeApplicationGrant(req, res) {
    const { user } = req;
    await revokeApplicationGrant(user);
    // even if the token revoke fails, we return a
    // 200 because we still want to prompt a reauth flow
    return res.json({});
  },
};
