import React from 'react';
import PageSettingsForm from './pageSettingsForm';
import Codemirror from './codemirror';
import { parseYaml, writeYaml } from '../../../../util/parseYaml';

const propTypes = {
  frontmatter: React.PropTypes.string.isRequired,
  onChange: React.PropTypes.func.isRequired,
  templateConfig: React.PropTypes.string.isRequired
};

const getPageLayoutsFromConfig = (config) => {
  if (!config.defaults) {
    return [];
  }

  return config.defaults[0].values.layout;
};

const buildBaseFormFields = (layouts, handleChange) => {
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

const getFormFieldsFromFrontmatter = (baseFields, yaml) => {
  baseFields.forEach((fieldConfig) => {
    const fieldName = fieldConfig.props.name;
    const frontmatterSharedData = yaml[fieldName];
    if (frontmatterSharedData) {
      fieldConfig.props.value = frontmatterSharedData;
      delete yaml[fieldName];
    }
  });
};

class PageSettings extends React.Component {
  constructor(props) {
    super(props);

    // we need a reference to the original frontmatter so we can update it as
    // changes come in
    this.state = parseYaml(this.props.frontmatter);

    this.handleChange = this.handleChange.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    this.setState(parseYaml(nextProps.frontmatter));
  }

  handleChange(maybeObj) {
    let keyValueObj;

    keyValueObj = typeof maybeObj === 'string' ? parseYaml(maybeObj) : maybeObj;

    this.setState(keyValueObj, () => {
      this.props.onChange(writeYaml(this.state));
    });
  }

  render() {
    const { frontmatter, onChange, templateConfig } = this.props;
    const configJSON = parseYaml(this.props.templateConfig);
    const layouts = getPageLayoutsFromConfig(configJSON);
    const yaml = Object.assign({}, this.state);
    const baseFields = buildBaseFormFields(layouts, this.handleChange);

    getFormFieldsFromFrontmatter(baseFields, yaml);

    return (
      <div className="usa-grid">
        <PageSettingsForm fields={baseFields}/>
        <Codemirror
          initialFrontmatterContent={writeYaml(yaml)}
          onChange={this.handleChange}
        />
      </div>
    )
  }
}

PageSettings.propTypes = propTypes;

export default PageSettings;
