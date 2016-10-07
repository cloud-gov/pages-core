import yaml from 'yamljs';

// Input a potential YAML string and receive a JS object.
const parseYaml = (maybeYaml) => {
  let output;

  try {
    output = yaml.parse(maybeYaml) || {};
  } catch(error) {
    output = {};
  }

  return output;
};

const writeYaml = (object) => {
  return yaml.stringify(object);
};

export {
  parseYaml,
  writeYaml
};
