/* eslint-disable no-await-in-loop */

const { BuildTask } = require('../../models');
const { paginate, wrapHandlers } = require('../../utils');

module.exports = wrapHandlers({
  async list(req, res) {
    const {
      limit, page, site,
    } = req.query;

    const scopes = [];

    if (site) {
      scopes.push(BuildTask.siteScope(site));
    }

    const pagination = await paginate(
      BuildTask.scope(scopes),
      a => a,
      { limit, page }
    );

    const json = {
      ...pagination,
    };

    return res.json(json);
  },
});
