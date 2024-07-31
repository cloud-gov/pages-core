import React from 'react';
import PropTypes from 'prop-types';
import About from './about';
export default function Zap({ data }) {
  return (
    <div>
      <About scanType='zap'/>
      <pre>{JSON.stringify(data, null, "  ")}</pre>
    </div>
  );
}

Zap.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  data: PropTypes.object.isRequired,
};
