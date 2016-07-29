import React from 'react';

const propTypes = {
  fileName: React.PropTypes.string.isRequired,
  handleChange: React.PropTypes.func.isRequired
};

class PageMetadata extends React.Component {
  constructor(props) {
    super(props);

    this.handleChange = this.handleChange.bind(this);
  }

  handleChange(event) {
    const { name, value } = event.target;

    this.props.handleChange(name, value);
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
