import React from 'react';
import PropTypes from 'prop-types';
import About from './about';

export default function A11y({ data }) {
  return (
    <div>
      <About scanType='a11y' siteId="0"/>
      <pre>{JSON.stringify(data, null, "  ")}</pre>
    </div>
  );
}

A11y.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  data: PropTypes.object.isRequired,
};
