import React from 'react';
import PropTypes from 'prop-types';

const getStateColor = (state) => {
  switch (state) {
    case 'provisioned':
      return 'rgb(12, 175, 0)';
    case 'failed':
      return '#d83731';
    case 'pending':
      return '#112e51';
    default:
      return '#e27600';
  }
};

export default function StateIndicator({ state }) {
  return (
    <div
      className="usa-tag usa-tag--big radius-pill font-body-2xs text-ls-1"
      style={{
        backgroundColor: getStateColor(state),
      }}
    >
      {state}
    </div>
  );
}

StateIndicator.propTypes = {
  state: PropTypes.string.isRequired,
};
