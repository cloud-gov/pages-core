import React from 'react';
import PropTypes from 'prop-types';
import LoadingIndicator from './LoadingIndicator';

class Await extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isLoading: true,
      data: null,
    };
  }

  componentDidMount() {
    const { on } = this.props;
    on()
      .then((response) => {
        this.setState({ isLoading: false, data: response });
      });
  }

  render() {
    const { isLoading, data } = this.state;
    const { missing, render } = this.props;

    if (isLoading) {
      return <LoadingIndicator />;
    }

    if (!data || data.length === 0) {
      return (
        <div className="usa-grid">
          <h3>{missing}</h3>
        </div>
      );
    }

    return render(data);
  }
}

Await.propTypes = {
  on: PropTypes.func.isRequired,
  missing: PropTypes.string,
  render: PropTypes.func.isRequired,
};

Await.defaultProps = {
  missing: 'No data found.',
};

export default Await;
