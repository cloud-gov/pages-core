import React from 'react';

class Provider extends React.Component {
  getChildContext() {
    return {
      state: this.state
    };
  }

  constructor(props, context) {
    super(props, context)
    this.state = props.state
  }

  render() {
    return React.Children.only(this.props.children)
  }
}

Provider.childContextTypes = {
  state: React.PropTypes.object
};

export default Provider;
