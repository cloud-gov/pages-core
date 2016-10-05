import React from 'react';
import PageSettingsForm from './pageSettingsForm';
import Codemirror from './codemirror';
import { parseYaml, writeYaml } from '../../../../util/parseYaml';
import frontmatterToPageConfigs from './frontmatterToPageConfigs';
import getPageLayoutsFromConfig from './getPageLayoutsFromConfig';

const propTypes = {
  frontmatter: React.PropTypes.string.isRequired,
  onChange: React.PropTypes.func.isRequired,
  templateConfig: React.PropTypes.string.isRequired
};

class PageSettings extends React.Component {
  constructor(props) {
    super(props);

    this.handleChange = this.handleChange.bind(this);
  }

  handleChange(maybeObj) {
    const { frontmatter } = this.props;
    let keyValueObj;
    let frontmatterAsObj;

    keyValueObj = typeof maybeObj === 'string' ? parseYaml(maybeObj) : maybeObj;
    frontmatterAsObj = Object.assign({}, parseYaml(frontmatter), keyValueObj);

    this.props.onChange(writeYaml(frontmatterAsObj));
  }

  render() {
    const { frontmatter, onChange, templateConfig } = this.props;
    const layouts = getPageLayoutsFromConfig(templateConfig);

    const {
      fields,
      configuration
    } = frontmatterToPageConfigs(frontmatter, layouts, this.handleChange);

    return (
      <div className="usa-grid">
        <PageSettingsForm fields={fields}/>
        <Codemirror
          initialFrontmatterContent={writeYaml(configuration)}
          onChange={this.handleChange}
        />
      </div>
    );
  }
}

PageSettings.propTypes = propTypes;

export default PageSettings;
