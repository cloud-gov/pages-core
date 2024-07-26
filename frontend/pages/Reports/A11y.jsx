import React from 'react';
import PropTypes from 'prop-types';

export default function A11y({ data }) {
  return (
    <div>
      <span>{JSON.stringify(data)}</span>
    </div>
  );
}

A11y.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  data: PropTypes.object.isRequired,
};
