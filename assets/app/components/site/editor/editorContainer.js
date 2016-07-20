import React from 'react';

import PageMetadata from './pageMetadata';
import Codemirror from './codemirror';
import Prosemirror from './prosemirror';

import siteActions from '../../../actions/siteActions';

const propTypes = {
  site: React.PropTypes.object
};

class Editor extends React.Component {
  constructor(props) {
    super(props);
  }

  getNewPage() {
    // TODO: would love to know if there is a way to pass props without typing it
    // to the react-router route property
    const newPage = this.props.isNewPage || this.props.route.isNewPage;

    return newPage ? <PageMetadata isNew={newPage} /> : null;
  }

  render() {
    return (
      <div>
        {this.getNewPage()}
        <Codemirror />
        <Prosemirror />
      </div>
    );
  }
}

Editor.propTypes = propTypes;

export default Editor;
