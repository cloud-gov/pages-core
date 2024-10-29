const yaml = require('js-yaml');
const _ = require('underscore');

const transforms = {
  '': (value) => value,
  date: (value) => value?.toISOString(),
  yaml: (value) => yaml.dump(value),
};

class BaseSerializer {
  constructor(attributes, adminAttributes) {
    this.attributes = attributes;
    this.adminAttributes = adminAttributes;
    this.serialize = this.serialize.bind(this);
    this.serializeMany = this.serializeMany.bind(this);
  }

  serialize(model, isSystemAdmin = false) {
    if (!model) {
      return null;
    }

    const allAttributes = {
      ...this.attributes,
      ...(isSystemAdmin ? this.adminAttributes : {}),
    };

    function applyTransforms(spec, attribute) {
      const transform = typeof spec === 'function' ? spec : transforms[spec];

      return transform(model.get(attribute), model, isSystemAdmin);
    }

    return _.mapObject(allAttributes, applyTransforms);
  }

  serializeMany(models, isSystemAdmin = false) {
    return models.map((model) => this.serialize(model, isSystemAdmin));
  }
}

module.exports = BaseSerializer;
