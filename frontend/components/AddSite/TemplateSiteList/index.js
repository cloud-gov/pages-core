import React from 'react';

import TemplateSite from './templateSite';

const propTypes = {
  templates: React.PropTypes.object.isRequired,
  handleSubmitTemplate: React.PropTypes.func.isRequired
};

const MAX_CELLS_PER_ROW = 3;
const CELL_WIDTHS = ['', 'whole', 'half', 'third', 'fourth'];

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

class TemplateList extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      activeChildId: -1
    };

    this.handleChooseActive = this.handleChooseActive.bind(this);
  }

  handleChooseActive(childId) {
    this.setState({
      activeChildId: childId
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
    // i.e. 'whole', 'half', 'third', or 'fourth'
    const cellSize = CELL_WIDTHS[cellsPerRow];

    let index = 0;

    const templateGrid = templateRows.map((row, rowIndex) => {
      return (
        <div className="usa-grid" key={rowIndex}>
          {row.map((templateName, cellIndex) => {
            const template = templates[templateName];
            return (
              <div
                  className={`usa-width-one-${cellSize}`}
                  key={cellIndex}>
                <TemplateSite
                  name={templateName}
                  index={index++}
                  thumb={template.thumb}
                  active={this.state.activeChildId}
                  handleChooseActive={this.handleChooseActive}
                  handleSubmit={this.props.handleSubmitTemplate}
                  defaultOwner={this.props.defaultOwner}
                  {...template} />
              </div>
            );
          })}
        </div>
      );
    });

    return (
      <div>
        <div className="usa-grid">
          <div className="usa-width-one-whole">
            <h2>Choose from one of our templates</h2>
          </div>
        </div>
        {templateGrid}
      </div>
    );
  }
}

TemplateList.propTypes = propTypes;

export default TemplateList;
