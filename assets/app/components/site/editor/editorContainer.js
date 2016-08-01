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

    this.state = this.getStateWithProps(props);
    this.submitFile = this.submitFile.bind(this);
    this.handleChange = this.handleChange.bind(this);
  }

  componentDidMount() {
    // trigger the fetch file content action for the case
    // when a user first loads this view. That could be
    // a changing of the route to a site for the first time
    // or directly loading the url
    siteActions.fetchFileContent(this.props.site, this.path);
  }

  componentWillReceiveProps(nextProps) {
    const nextState = this.getStateWithProps(nextProps);
    this.setState(nextState);
  }

  getStateWithProps(props) {
    const file = this.getCurrentFile(props);
    const content = (file && file.content) ? decodeB64(file.content) : false;
    const { frontmatter, markdown } = this.splitContent(content)

    return {
      encoded: (file && file.content) ? file.content : false,
      frontmatter,
      markdown,
      path: (file) ? file.path : false,
      raw: content,
      sha: (file) ? file.sha : false
    };
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
    const { frontmatter, markdown, message, path, sha } = this.state;
    let content = markdown;

    if (frontmatter) {
      content = `---\n${frontmatter}\n---\n${markdown}`;
    }
    else if (frontmatter && !markdown) {
      content = frontmatter;
    }
    // const normalizedFilename = fileName + '.md';

    console.log(`submitting ${path} with a message of ${message}`);
    console.log('content\n', content);

    // if (!path) {
    //   alertActions.httpError('File must have a name');
    // } else {
    //   siteActions.createCommit(site, path, fileContents);
    // }
  }

  handleChange(name, value) {
    const nextState = {};
    nextState[name] = value;
    this.setState(nextState);
  }

  getCurrentFile(props) {
    props = props || { site: {} };
    const files = props.site.files || [];
    return files.find((file) => {
      return file.path === this.path;
    });
  }

  splitContent(content) {
    if (!content) return {};
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

  render() {
    let message = this.state.message || `Changes made to ${this.state.path}`;
    return (
      <div>
        {this.getNewPage()}
        <Codemirror
          initialFrontmatterContent={ this.state.frontmatter }
          onChange={ (frontmatter) => {
            this.handleChange('frontmatter', frontmatter)
          }}
        />
        <Prosemirror
          initialMarkdownContent={ this.state.markdown }
          onChange={ (markdown) => {
            this.handleChange('markdown', markdown);
          }}
        />
        <input type="text" name="message"
          onChange={ this.handleChange } value={ message }
        />
        <button onClick={this.submitFile}>Submit</button>
      </div>
    );
  }
}

Editor.propTypes = propTypes;

export default Editor;
