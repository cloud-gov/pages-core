import React from 'react';
import PropTypes from 'prop-types';
import shortid from 'shortid';

// Based on the USWDS Accordion, but only ever has a single
// item that can be expanded or collapsed

function ExpandableArea(props) {
  const id = `expandable-area-${shortid.generate()}`;
  const { bordered, children, title } = props;
  return (
    <div className={`usa-accordion${bordered ? '-bordered' : ''}`}>
      <button
        className="usa-accordion-button"
        aria-expanded={false} // this is controlled by uswds.js
        aria-controls={id}
        type="button"
      >
        {title}
      </button>
      <div
        id={id}
        className="usa-accordion-content"
        aria-hidden
      >
        {children}
      </div>
    </div>
  );
}

ExpandableArea.propTypes = {
  bordered: PropTypes.bool,
  title: PropTypes.string.isRequired,
  children: PropTypes.node,
};

ExpandableArea.defaultProps = {
  bordered: false,
  children: null,
};

export default ExpandableArea;
