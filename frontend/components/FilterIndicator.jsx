import React from 'react';
import PropTypes from 'prop-types';

const FilterIndicator = ({
  criteria = null, count = null, children = null, noun = 'result',
}) => criteria && (
<div className="usa-alert usa-alert-slim usa-alert-info usa-alert-no_icon ">
  <p className="usa-alert-text">
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
);

FilterIndicator.propTypes = {
  criteria: PropTypes.string,
  count: PropTypes.number,
  children: PropTypes.node,
  noun: PropTypes.string,
};

export default FilterIndicator;
