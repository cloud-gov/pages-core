import React from 'react';

import { decodeB64 } from '../../../util/encoding'

import PageMetadata from './pageMetadata';
import Codemirror from './codemirror';
import Prosemirror from './prosemirror';

import documentStrategy from '../../../util/documentStrategy';

import alertActions from '../../../actions/alertActions';
import siteActions from '../../../actions/siteActions';

const propTypes = {
  site: React.PropTypes.object
};

class Editor extends React.Component {
  constructor(props) {
    super(props);

    this.state = {};
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
    const path = file ? file.path : false;
    const { frontmatter, markdown, raw, content } = documentStrategy(file);

    return {
      encoded: file.content || false,
      frontmatter,
      markdown,
      message: false,
      path,
      raw: content,
      sha: file.sha || false
    };
  }

  submitFile() {
    const { site } = this.props;
    let { frontmatter, markdown, message, path, sha } = this.state;
    let content = markdown;

    if (!path) {
      return alertActions.alertError('File must have a name');
    }

    if (message === '') {
      return alertActions.alertError('You must supply a commit message');
    }

    if (frontmatter) {
      content = `---\n${frontmatter}\n---\n${markdown}`;
    }
    else if (frontmatter && !markdown) {
      content = frontmatter;
    }

    if (this.props.route.isNewPage) {
      path = `${path}.md`;
    }

    siteActions.createCommit(site, path, content, message, sha);
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

  get path() {
    const params = this.props.params;
    if (params.splat) {
      return `${params.splat}/${params.fileName}`;
    }
    return params.fileName;
  }

  getComputedMessage() {
    const newPage = this.props.route.isNewPage;
    const hasMessage = this.state.message || this.state.message === '';
    if (hasMessage) return this.state.message;
    if (newPage) return `New page added at ${this.state.path}`;
    return `Changes made to ${this.state.path}`;
  }

  getNewPage() {
    // TODO: would love to know if there is a way to pass props without typing it
    // to the react-router route property
    const newPage = this.props.route.isNewPage;

    if (newPage) {
      return (
        <PageMetadata
          path={this.state.path}
          handleChange={this.handleChange}/>
      );
    }

    return null;
  }

  render() {
    const computedMessage = this.getComputedMessage();
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
        <div className="usa-alert usa-alert-info">
          <div className="usa-alert-body">
            <h3 className="usa-alert-heading"></h3>
            <p className="usa-alert-text">Make this a helpful save message for yourself and future collaborators.</p>
            <input type="text" name="message"
              value={ computedMessage }
              onChange={ (event) => {
                this.handleChange('message', event.target.value);
              }}
            />
            <button onClick={this.submitFile}>Submit</button>
          </div>
        </div>
      </div>
    );
  }
}

Editor.propTypes = propTypes;

export default Editor;
