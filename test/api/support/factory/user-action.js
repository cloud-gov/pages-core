const userFactory = require('./user');
const siteFactory = require('./site');
const { UserAction, ActionType } = require('../../../../api/models');

const attributes = (overrides = {}) => {
  let { user, site, target, actionType } = overrides;

  if (!user) {
    user = userFactory();
  }

  if (!site) {
    site = Promise.resolve(user).then((siteUser) =>
      siteFactory({
        users: [siteUser],
      }),
    );
  }

  if (!actionType) {
    actionType = ActionType.findOne({
      where: {
        action: 'remove',
      },
    });
  }

  if (!target) {
    target = userFactory();
  }

  return Object.assign(
    {
      site,
      user,
      actionType,
      target,
      targetType: 'user',
    },
    overrides,
  );
};

const prepareAttributes = (attrs) => ({
  userId: attrs.user.id,
  targetId: attrs.target.id,
  targetType: attrs.targetType,
  actionId: attrs.actionType.id,
  siteId: attrs.site.id,
});

const build = (overrides) =>
  Promise.props(attributes(overrides)).then((attrs) =>
    UserAction.create(prepareAttributes(attrs)),
  );

const buildMany = (count, overrides = {}) =>
  Promise.props(attributes(overrides)).then((attrs) => {
    const finalAttributes = prepareAttributes(attrs);

    return Promise.all(
      Array(count)
        .fill(0)
        .map(() => UserAction.create(finalAttributes)),
    );
  });

module.exports = {
  build,
  buildMany,
};
