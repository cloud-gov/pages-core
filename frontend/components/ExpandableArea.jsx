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
    this.setState({ isExpanded: !this.state.isExpanded });
  }

  render() {
    return (
      <div className="usa-accordion">
        <button
          onClick={this.toggle}
          className="usa-accordion-button"
          aria-expanded={this.state.isExpanded}
          aria-controls={this.id}
        >
          {this.props.title}
        </button>
        <div
          id={this.id}
          className="usa-accordion-content"
          aria-hidden={!this.state.isExpanded}
        >
          {this.props.children}
        </div>
      </div>
    );
  }
}

ExpandableArea.propTypes = {
  title: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
};

export default ExpandableArea;
