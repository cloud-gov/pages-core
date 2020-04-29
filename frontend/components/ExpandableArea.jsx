import React from 'react';
import PropTypes from 'prop-types';
import shortid from 'shortid';
import autoBind from 'react-autobind';

// Based on the USWDS Accordion, but only ever has a single
// item that can be expanded or collapsed

class ExpandableArea extends React.Component {
  constructor(props) {
    super(props);
    this.id = `expandable-area-${shortid.generate()}`;

    this.state = {
      isExpanded: false,
    };

    autoBind(this, 'toggle');
  }

  toggle() {
    const { isExpanded } = this.state;
    this.setState({ isExpanded: !isExpanded });
  }

  render() {
    const { bordered, children, title } = this.props;
    const { isExpanded } = this.state;

    return (
      <div className={`usa-accordion${bordered ? '-bordered' : ''}`}>
        <button
          onClick={this.toggle}
          className="usa-accordion-button"
          aria-expanded={isExpanded}
          aria-controls={this.id}
          type="button"
        >
          {title}
        </button>
        <div
          id={this.id}
          className="usa-accordion-content"
          aria-hidden={!isExpanded}
        >
          {children}
        </div>
      </div>
    );
  }
}

ExpandableArea.propTypes = {
  bordered: PropTypes.bool,
  title: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
};

ExpandableArea.defaultProps = {
  bordered: false,
};

export default ExpandableArea;
