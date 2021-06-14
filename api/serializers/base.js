const yaml = require('js-yaml');
const _ = require('underscore');

const transforms = {
  '': value => value,
  date: value => value?.toISOString(),
  yaml: value => yaml.dump(value),
};

function generateSerializer(attributes, adminAttributes) {
  function serialize(model, isSystemAdmin = false) {
    if (!model) {
      return null;
    }

    const allAttributes = {
      ...attributes, ...(isSystemAdmin ? adminAttributes : {}),
    };

    function applyTransforms(spec, attribute) {
      const transform = (typeof spec === 'function')
        ? spec
        : transforms[spec];

      return transform(model.get(attribute), model, isSystemAdmin);
    }

    return _.mapObject(allAttributes, applyTransforms);
  }

  function serializeMany(models, isSystemAdmin = false) {
    return models.map(model => serialize(model, isSystemAdmin));
  }

  return { serialize, serializeMany };
}

module.exports = generateSerializer;
