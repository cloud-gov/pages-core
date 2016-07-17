import React from 'react';

import Codemirror from './codemirror';
import Prosemirror from './prosemirror';

import siteActions from '../../../actions/siteActions';

const propTypes = {
  site: React.PropTypes.object
};

class Editor extends React.Component {
  render() {
    return (
      <div>
        <Codemirror />
        <Prosemirror />
      </div>
    );
  }
}

Editor.propTypes = propTypes;

export default Editor;
