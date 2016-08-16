import React from 'react';

import { decodeB64 } from '../../../util/encoding'

import PageMetadata from './pageMetadata';
import Codemirror from './codemirror';
import Prosemirror from './prosemirror';
import ImagePicker from './imagePicker';

import documentStrategy from '../../../util/documentStrategy';

import alertActions from '../../../actions/alertActions';
import siteActions from '../../../actions/siteActions';

import convertImageToData from '../../../util/convertImageToData';

const propTypes = {
  site: React.PropTypes.object
};

class Editor extends React.Component {
  constructor(props) {
    super(props);

    this.state = {};
    this.submitFile = this.submitFile.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.onInsertImage = this.onInsertImage.bind(this);
    this.onCancelInsertImage = this.onCancelInsertImage.bind(this);
    this.onConfirmInsertImage = this.onConfirmInsertImage.bind(this);
    this.onUpload = this.onUpload.bind(this);
  }

  componentDidMount() {
    // This action should be triggered when a user first loads this view,
    // either visiting it directly from the url bar or navigating here
    // with react router
    siteActions.fetchFileContent(this.props.site, this.path);
  }

  componentWillReceiveProps(nextProps) {
    const nextState = this.getStateWithProps(nextProps);
    this.setState(nextState);
  }

  onInsertImage() {
    this.setState({
      imagePicker: true
    });
  }

  onConfirmInsertImage(fileName) {
    this.setState({
      selected: this.props.site.assets.find((asset) => asset.path === fileName)
    });
  }

  onCancelInsertImage() {
    this.setState({
      imagePicker: false
    });
  }

  getStateWithProps(props) {
    const file = this.getCurrentFile(props) || {};
    const path = file.path || false;
    const { frontmatter, markdown, raw, content } = documentStrategy(file);

    return {
      encoded: file.content || false,
      frontmatter,
      markdown,
      message: false,
      path,
      raw: content,
      sha: file.sha || false,
      imagePicker: false
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
    const nextState = {};//{selected: null};
    nextState[name] = value;
    this.setState(nextState);
  }

  getCurrentFile(props) {
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

  getImagePicker() {
    return !this.state.imagePicker ? null :
      <ImagePicker
        handleConfirm={this.onConfirmInsertImage}
        handleUpload={this.onUpload}
        handleCancel={this.onCancelInsertImage}
        assets={this.props.site.assets}/>;
  }

  onUpload(file) {
    const { site, routeParams } = this.props;

    // TODO: should an action creator do this? Do we want a seperate action for
    // uploading images (and possibly other file types in the future) that
    // conforms to the createCommit interface in the github api service?
    convertImageToData(file).then(function (fileData) {
      const fileName = file.name;
      // TODO: hardcoded for now, will need to parse the _config.yml file
      // at some point in the future to dtermine if the federalist user has
      // specified a different content directory
      const path = `assets/${fileName}`;
      const message = `Uploads ${fileName} to project`;

      siteActions.createCommit(site, path, fileData, message);
    });
  }

  // TODO: break up this component. We need an intermediate form component that
  // handles submission of the form content. This container should just render
  // the form and the image picker, and probably call actions after content has
  // been verified.
  render() {
    const computedMessage = this.getComputedMessage();

    return (
      <div>
        {this.getImagePicker()}
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
          handleToggleImages={this.onInsertImage}
          selected={this.state.selected}
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
