import React from 'react';
import PropTypes from 'prop-types';
import { capitalize } from '@util';

export default function ContextTitle({ context }) {
  return (
    <div style={{ display: 'inline-block' }}>
      <h4 className="font-sans-lg margin-0">
        {context === 'site' ? 'Live Site' : `${capitalize(context)} Site`}
      </h4>
    </div>
  );
}

ContextTitle.propTypes = {
  context: PropTypes.string.isRequired,
};
