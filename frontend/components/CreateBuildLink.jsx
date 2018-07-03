import React from 'react';
import PropTypes from 'prop-types';

class CreateBuildLink extends React.Component {
  constructor(props) {
    super(props);

    this.handleClick = this.handleClick.bind(this);
  }

  handleClick(event) {
    event.preventDefault();
    const { handlerParams } = this.props;
    const args = Object.keys(handlerParams).map(key => handlerParams[key]);

    this.props.handleClick.apply(null, args);
  }

  render() {
    const { children } = this.props;

    return (
      /* eslint-disable jsx-a11y/href-no-hash */
      <a
        href="#"
        role="button"
        onClick={this.handleClick}
      >
        {children}
      </a>
      /* eslint-enable jsx-a11y/href-no-hash */
    );
  }
}

CreateBuildLink.propTypes = {
  handlerParams: PropTypes.object,
  handleClick: PropTypes.func.isRequired,
  children: PropTypes.node.isRequired,
};

CreateBuildLink.defaultProps = {
  handlerParams: {},
};

export default CreateBuildLink;
