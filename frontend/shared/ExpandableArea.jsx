import React, { useId } from 'react';
import PropTypes from 'prop-types';

// Based on the USWDS Accordion, but only ever has a single
// item that can be expanded or collapsed

function ExpandableArea({
  title,
  bordered = false,
  children = null,
  isExpanded = false,
}) {
  // specifically don't generate this id with another library like nanoid
  // https://github.com/ai/nanoid/?tab=readme-ov-file#usage
  const partialId = useId();
  const id = `expandable-area-${partialId}`;
  return (
    <div
      className={`usa-accordion ${bordered ? 'usa-accordion--bordered' : ''} width-full`}
    >
      <div className="usa-accordion__heading">
        <button
          className="usa-accordion__button"
          aria-expanded={isExpanded} // this is controlled by uswds.js
          aria-controls={id}
          type="button"
        >
          {title}
        </button>
      </div>
      <div id={id} className="usa-accordion__content" hidden={!isExpanded}>
        {children}
      </div>
    </div>
  );
}

ExpandableArea.propTypes = {
  bordered: PropTypes.bool,
  title: PropTypes.string.isRequired,
  children: PropTypes.node,
  isExpanded: PropTypes.bool,
};

export default ExpandableArea;
