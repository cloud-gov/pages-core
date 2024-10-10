import React from 'react';
import PropTypes from 'prop-types';

const FilterIndicator = ({
  criteria = null, count = null, children = null, noun = 'result',
}) => criteria && (
<div className="usa-alert usa-alert--info usa-alert--slim usa-alert--no-icon">
  <div className="usa-alert__body">
    <p className="usa-alert__text">
      Showing
      {' '}
      <b>{count}</b>
      {' '}
      matching
      {' '}
      {noun}
      {count !== 1 ? 's' : ''}
      {' '}
      for
      {' '}
      <b>{criteria}</b>
      .
      { children }
    </p>
  </div>
</div>
);

FilterIndicator.propTypes = {
  criteria: PropTypes.string,
  count: PropTypes.number,
  children: PropTypes.node,
  noun: PropTypes.string,
};

export default FilterIndicator;
