const _ = require('underscore');
const { wrapHandlers } = require('../utils');
const { serialize, serializeMany } = require('../serializers/site-branch-config');
const EventCreator = require('../services/EventCreator');
const { ValidationError, parseSiteConfig } = require('../utils/validators');
const { Build, Site, SiteBranchConfig, Event } = require('../models');

function generateS3Key(site, context, branch) {
  if (context === 'site' || context === 'demo') {
    return `/${context}/${site.owner}/${site.repository}`;
  }

  if (context === 'preview') {
    return null;
  }

  return `preview/${site.owner}/${site.repository}/${encodeURIComponent(branch)}`;
}

function validate({ branch, config = {}, context } = {}) {
  const parsedConfig = parseSiteConfig(config);

  if (context && typeof context !== 'string') {
    throw new ValidationError('Context must be a valid string.');
  }

  if (
    parsedConfig instanceof Error ||
    typeof parsedConfig === 'number' ||
    typeof parsedConfig === 'string'
  ) {
    throw new ValidationError('Config must be valid JSON or YAML.');
  }

  return {
    branch,
    config: parsedConfig,
    context,
  };
}

module.exports = wrapHandlers({
  async find(req, res) {
    const { params, user } = req;
    const { site_id: siteId } = params;

    const site = await Site.forUser(user).findByPk(siteId);

    if (!site) {
      return res.notFound();
    }

    const siteBranchConfigs = await SiteBranchConfig.findAll({
      where: {
        siteId: site.id,
      },
    });

    const json = serializeMany(siteBranchConfigs);

    return res.ok(json);
  },

  async create(req, res) {
    const { body, params, user } = req;
    const { site_id: siteId } = params;

    const site = await Site.forUser(user).findByPk(siteId);

    if (!site) {
      return res.notFound();
    }

    try {
      const { branch, config, context } = validate(body);
      const s3Key = generateS3Key(site, context, branch);

      const sbc = await SiteBranchConfig.create({
        siteId: site.id,
        branch,
        config,
        context,
        s3Key,
      });

      EventCreator.audit(Event.labels.USER_ACTION, req.user, 'SiteBranchConfig Created', {
        siteBranchConfig: {
          id: sbc.id,
          siteId,
        },
      });

      if (context && context !== 'preview' && branch) {
        const build = await Build.create({
          user: req.user.id,
          site: sbc.siteId,
          branch,
          username: req.user.username,
        });

        await build.enqueue();

        EventCreator.audit(
          Event.labels.USER_ACTION,
          req.user,
          'Build started by SiteBranchConfig creation',
          {
            siteBranchConfig: {
              id: sbc.id,
              siteId,
              buildId: build.id,
            },
          },
        );
      }

      const json = serialize(sbc);

      return res.ok(json);
    } catch (error) {
      if (error.errors) {
        const duplicateBranchError = error.errors.find(
          (err) => err.type === 'unique violation',
        );

        if (duplicateBranchError) {
          return res.badRequest({
            message:
              // eslint-disable-next-line max-len
              'An error occurred creating the site branch config: Branch names must be unique per site.',
          });
        }
      }
      return res.badRequest({
        message: `An error occurred creating the site branch config: ${error.message}`,
      });
    }
  },

  async destroy(req, res) {
    const { params, user } = req;
    const { id, site_id: siteId } = params;

    const site = await Site.forUser(user)
      .findByPk(siteId)
      .catch(() => null);

    if (!site) {
      return res.notFound();
    }

    const siteBranchConfig = await SiteBranchConfig.findOne({
      where: {
        id,
        siteId,
      },
    });

    if (!siteBranchConfig) {
      return res.notFound();
    }

    await siteBranchConfig.destroy();
    EventCreator.audit(Event.labels.USER_ACTION, req.user, 'SiteBranchConfig Destroyed', {
      siteBranchConfig: {
        id,
        siteId,
        branch: siteBranchConfig.branch,
        context: siteBranchConfig.context,
      },
    });

    return res.ok({});
  },

  async update(req, res) {
    const { body, params, user } = req;
    const { site_id: siteId, id } = params;

    const site = await Site.forUser(user).findByPk(siteId);

    if (!site) {
      return res.notFound();
    }

    try {
      const { branch, config, context } = validate(body);
      const sbc = await SiteBranchConfig.findByPk(id);

      if (!sbc) {
        return res.notFound();
      }

      const payload = _.omit(
        {
          branch,
          config,
          context,
        },
        (x) => !x,
      );

      const sbcUpdated = await sbc.update(payload, {
        where: {
          id,
          siteId,
        },
      });

      EventCreator.audit(Event.labels.USER_ACTION, req.user, 'SiteBranchConfig Updated', {
        siteBranchConfig: {
          id: sbcUpdated.id,
          siteId,
        },
      });

      if (context && context !== 'preview' && branch) {
        const build = await Build.create({
          user: req.user.id,
          site: sbcUpdated.siteId,
          branch,
          username: req.user.username,
        });

        await build.enqueue();

        EventCreator.audit(
          Event.labels.USER_ACTION,
          req.user,
          'Build started by SiteBranchConfig update',
          {
            siteBranchConfig: {
              id: sbcUpdated.id,
              siteId,
              buildId: build.id,
            },
          },
        );
      }

      const json = serialize(sbcUpdated);

      return res.ok(json);
    } catch (error) {
      return res.badRequest({
        message: `An error occurred updating the site branch config: ${error.message}`,
      });
    }
  },
});
