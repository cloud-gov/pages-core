import React from 'react';
import PropTypes from 'prop-types';

const propTypes = {
  handlerParams: PropTypes.object,
  children: PropTypes.node,
  handleClick: PropTypes.func,
};

class CreateBuildLink extends React.Component {
  constructor(props) {
    super(props);

    this.handleClick = this.handleClick.bind(this);
  }

  handleClick(event) {
    event.preventDefault;
    const { handlerParams } = this.props;
    const args = Object.keys(handlerParams).map(key => handlerParams[key]);

    this.props.handleClick.apply(null, args);
  }

  render() {
    const { handleClick, children } = this.props;

    return (
      /* eslint-disable jsx-a11y/href-no-hash */
      <a
        href="#"
        role="button"
        onClick={this.handleClick}
      >
        {this.props.children}
      </a>
      /* eslint-enable jsx-a11y/href-no-hash */
    );
  }
};

CreateBuildLink.propTypes = propTypes;
CreateBuildLink.defaultProps = {
  handlerParams: {},
};

export default CreateBuildLink;
