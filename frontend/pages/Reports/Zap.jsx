import React from 'react';
import PropTypes from 'prop-types';

export default function Zap({ data }) {
  return (
    <div>
      <span>{JSON.stringify(data)}</span>
    </div>
  );
}

Zap.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  data: PropTypes.object.isRequired,
};
