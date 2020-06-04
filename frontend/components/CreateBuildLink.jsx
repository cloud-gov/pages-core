import React from 'react';
import PropTypes from 'prop-types';

class CreateBuildLink extends React.Component {
  constructor(props) {
    super(props);

    this.handleClick = this.handleClick.bind(this);
  }

  handleClick(event) {
    event.preventDefault();
    const { handleClick, handlerParams } = this.props;
    const args = Object.keys(handlerParams).map(key => handlerParams[key]);

    handleClick(...args);
  }

  render() {
    const { children, className } = this.props;

    return (
      <a
        href="#"
        role="button"
        onClick={this.handleClick}
        className={className}
      >
        {children}
      </a>
    );
  }
}

CreateBuildLink.propTypes = {
  // Handler params object is intentionally ambiguous to allow the parent
  // component to specify params for the handleClick function
  // eslint-disable-next-line react/forbid-prop-types
  handlerParams: PropTypes.object,
  handleClick: PropTypes.func.isRequired,
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

CreateBuildLink.defaultProps = {
  handlerParams: {},
  className: '',
};

export default CreateBuildLink;
