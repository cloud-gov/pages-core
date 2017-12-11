import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

import TemplateSite from './templateSite';

const propTypes = {
  templates: PropTypes.object.isRequired,
  handleSubmitTemplate: PropTypes.func.isRequired,
  defaultOwner: PropTypes.string.isRequired,
};

const MAX_CELLS_PER_ROW = 4;

/**
 * Create a two-dimensional array of values that represent one or more rows
 * of values, with `perRow` values per row.
 *
 * @param {array<*>} values
 * @param {integer} perRow
 * @return {array<array<*>>}
 */
const createRowsOf = (values, perRow) => {
  let row = [];
  const rows = [row];
  values.forEach((val, index) => {
    if (index === perRow) {
      rows.push(row = []);
    }
    row.push(val);
  });
  return rows;
};

export class TemplateList extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      activeChildId: -1,
    };

    this.handleChooseActive = this.handleChooseActive.bind(this);
  }

  handleChooseActive(childId) {
    this.setState({
      activeChildId: childId,
    });
  }

  render() {
    const { templates } = this.props;

    const templateKeys = Object.keys(templates);
    // if there are fewer templates than cells per row,
    // fill the space with them
    const cellsPerRow = Math.min(templateKeys.length, MAX_CELLS_PER_ROW);
    // generate a two-dimensional array of template keys
    const templateRows = createRowsOf(templateKeys, cellsPerRow);

    let index = 0;

    const templateGrid = templateRows.map(row => (
      <div className={`flexbox-grid flexbox-grid-${MAX_CELLS_PER_ROW}`} key={row}>
        {row.map((templateName) => {
          const template = templates[templateName];
          return (
            <TemplateSite
              name={templateName}
              index={index++} // eslint-disable-line no-plusplus
              thumb={template.thumb}
              active={this.state.activeChildId}
              handleChooseActive={this.handleChooseActive}
              handleSubmit={this.props.handleSubmitTemplate}
              defaultOwner={this.props.defaultOwner}
              {...template}
            />
          );
        })}
      </div>
    ));

    return (
      <div>
        <div className="usa-grid">
          <h2>Choose from one of our templates</h2>
          {templateGrid}
        </div>
      </div>
    );
  }
}

TemplateList.propTypes = propTypes;

const mapStateToProps = state => ({
  templates: state.FRONTEND_CONFIG.TEMPLATES,
});

export default connect(mapStateToProps)(TemplateList);
