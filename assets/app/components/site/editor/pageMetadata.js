import React from 'react';

const propTypes = {
  isNew: React.PropTypes.bool,
  fileName: React.PropTypes.string
};

class PageMetadata extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      fileName: props.fileName || ''
    };

    this.handleChange = this.handleCHange.bind(this);
  }

  handleChange(event) {
    const { name, value } = event.target;
    this.setState({
      name: value
    });
  }

  render() {
    const { fileName } = this.props;

    return (
      <div className="form-group">
        <label htmlFor="fileName">Enter a filename for this page</label>
        <input
          name="fileName"
          value={fileName}
          onChange={this.handleChange} />
      </div>
    );
  }
}

PageMetadata.propTypes = propTypes;

export default PageMetadata;
