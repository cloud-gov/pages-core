import React from 'react';

const propTypes = {
  path: React.PropTypes.oneOfType([
    React.PropTypes.string,
    React.PropTypes.bool
  ]).isRequired,
  handleChange: React.PropTypes.func.isRequired
};

const defaultProps = {
  path: ''
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
    const { path } = this.props;

    return (
      <div className="form-group">
        <label htmlFor="path">Enter a path for this page</label>
        <input
          name="path"
          value={path}
          onChange={this.handleChange} />
      </div>
    );
  }
}

PageMetadata.propTypes = propTypes;
PageMetadata.defaultProps = defaultProps;

export default PageMetadata;
