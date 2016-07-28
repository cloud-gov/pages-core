import React from 'react';

import { decodeB64 } from '../../../util/encoding'

import PageMetadata from './pageMetadata';
import Codemirror from './codemirror';
import Prosemirror from './prosemirror';

import alertActions from '../../../actions/alertActions';
import siteActions from '../../../actions/siteActions';

const propTypes = {
  site: React.PropTypes.object
};

class Editor extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      content: '',
      pageSettings: '',
      pageTitle: '',
      fileName: ''
    }

    this.submitFile = this.submitFile.bind(this);
    this.handleChange = this.handleChange.bind(this);
  }

  getNewPage() {
    // TODO: would love to know if there is a way to pass props without typing it
    // to the react-router route property
    const newPage = this.props.isNewPage || this.props.route.isNewPage;

    if (newPage) {
      return (
        <PageMetadata
          fileName={this.state.fileName}
          handleChange={this.handleChange}/>
      );
    }

    return null;
  }

  submitFile() {
    const { site } = this.props;
    const { fileName, content, pageSettings, pageTitle } = this.state;
    //some magic function to mash all these ^^^ together?
    const fileContents = '---\ntitle: hello\n---';
    const normalizedFilename = fileName + '.md';

    if (!fileName) {
      alertActions.httpError('File must have a name');
    } else {
      siteActions.createCommit(site, normalizedFilename, fileContents);
    }
  }

  handleChange(name, value) {
    const nextState = {};
    nextState[name] = value;

    this.setState(nextState);
  }

  splitContent(content) {
    const frontmatterDelimiterRegexMatch = /^---\n([\s\S]*?)---\n/;
    const matches = content.match(frontmatterDelimiterRegexMatch);

    if (!matches) return { markdown: content };

    let frontmatter = matches[1];
    let markdown = content.slice(matches[0].length);

    return { frontmatter, markdown };
  }

  get path() {
    const params = this.props.params;
    if (params.splat) {
      return `${params.splat}/${params.fileName}`;
    }
    return params.fileName;
  }

  get currentFileContent() {
    const files = this.props.site.files || [];
    const currentFile = files.find((file) => {
      return file.path === this.path;
    });

    if (currentFile && currentFile.content) {
      return decodeB64(currentFile.content);
    }
    return '';
  }

  get currentFileMarkdownContent() {
    const { markdown } = this.splitContent(this.currentFileContent);

    return markdown;
  }

  get currentFileFrontmatter() {
    const { frontmatter } = this.splitContent(this.currentFileContent);

    return frontmatter;
  }

  render() {
    return (
      <div>
        {this.getNewPage()}
        <Codemirror initialFrontmatterContent={ this.currentFileFrontmatter }/>
        <Prosemirror initialMarkdownContent={ this.currentFileMarkdownContent }/>
        <button onClick={this.submitFile}>Submit</button>
      </div>
    );
  }
}

Editor.propTypes = propTypes;

export default Editor;
