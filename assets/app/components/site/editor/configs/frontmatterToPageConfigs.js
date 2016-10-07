import { parseYaml } from '../../../../util/parseYaml';

const getBaseFormFields = (layouts, handleChange) => {
  return [{
    field: 'select',
    props: {
      name: 'layout',
      options: layouts,
      value: '',
      handler: handleChange
    }
  },
  {
    field: 'input',
    props: {
      type: 'text',
      name: 'title',
      value: '',
      handler: handleChange
    }
  }];
};

const splitFormFieldsAndPageConfigs = (baseFields, pageConfigs) => {
  let fields = baseFields.map((field) => {
    return Object.assign({}, field);
  });
  let configuration = Object.assign(pageConfigs);

  fields.forEach((fieldConfig) => {
    const fieldName = fieldConfig.props.name;
    const frontmatterSharedData = configuration[fieldName];
    if (frontmatterSharedData) {
      fieldConfig.props.value = frontmatterSharedData;
      delete configuration[fieldName];
    }
  });

  return { fields, configuration };
};

const frontmatterToPageConfigs = (frontmatter, pageLayouts, handleChange) => {
  const frontmatterObj = parseYaml(frontmatter);
  const baseFields = getBaseFormFields(pageLayouts, handleChange);

  return splitFormFieldsAndPageConfigs(baseFields, frontmatterObj);
};

export default frontmatterToPageConfigs;
