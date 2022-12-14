import React, { useState } from 'react';
import PropTypes from 'prop-types';
import shortid from 'shortid';

// Based on the USWDS Accordion, but only ever has a single
// item that can be expanded or collapsed

function ExpandableArea(props) {
  const id = `expandable-area-${shortid.generate()}`;
  const [isExpanded, setExpanded] = useState(false)

  const { bordered, children, title } = props;
  console.log(isExpanded)
  return (
    <div className={`usa-accordion${bordered ? '-bordered' : ''}`}>
      <button
        onClick={() => setExpanded(!isExpanded)}
        className="usa-accordion-button"
        aria-expanded={isExpanded}
        aria-controls={id}
        type="button"
      >
        {title}
      </button>
      <div
        id={id}
        className="usa-accordion-content"
        aria-hidden={!isExpanded}
      >
        {children}
      </div>
    </div>
  );
}

ExpandableArea.propTypes = {
  bordered: PropTypes.bool,
  render: PropTypes.func,
  title: PropTypes.string.isRequired,
  children: PropTypes.node,
};

ExpandableArea.defaultProps = {
  bordered: false,
  render: null,
  children: null,
};

export default ExpandableArea;
