const yaml = require('js-yaml');
const _ = require('underscore');

const transforms = {
  '': value => value,
  date: value => value.toISOString(),
  yaml: value => yaml.dump(value),
};

function getTransform(spec) {
  if (typeof spec === 'function') {
    return spec;
  }
  return transforms[spec];
}

function generateSerializer(attributes, adminAttributes) {
  function serialize(model, isSystemAdmin = false) {
    const allowedAttributes = {
      ...attributes, ...(isSystemAdmin ? adminAttributes : {}),
    };

    function applyTransforms(val, key) {
      const transformSpec = allowedAttributes[key];
      const transform = getTransform(transformSpec);
      return transform(val);
    }

    return _.chain(model.get())
      .pick(Object.keys(allowedAttributes))
      .mapObject(applyTransforms)
      .value();
  }

  function serializeMany(models, isSystemAdmin = false) {
    return models.map(model => this.serialize(model, isSystemAdmin));
  }

  return { serialize, serializeMany };
}

module.exports = generateSerializer;
