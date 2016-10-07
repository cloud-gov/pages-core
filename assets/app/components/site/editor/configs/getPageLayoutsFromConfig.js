import { parseYaml } from '../../../../util/parseYaml';

const getPageLayoutsFromConfig = yaml => {
  const configJSON = parseYaml(yaml);
  return getPageLayoutsFromYaml(configJSON);
};

const getPageLayoutsFromYaml = config => {
  if (!config.defaults) {
    return [];
  }

  return config.defaults[0].values.layout;
};

export default getPageLayoutsFromConfig;
