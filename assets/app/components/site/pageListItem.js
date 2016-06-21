import React from 'react';

const propTypes = {
  page: React.PropTypes.object
};

class PageListItem extends React.Component {
  getButtonCopy(page) {
    return page.type === 'dir' ? 'Open' : 'Edit';
  }

  render() {
    const { page } = this.props;

    return (
      <li className="list-group-item">
        <div className="usa-grid">
          <div className="usa-width-two-thirds">
            {page.name}
          </div>
          <div className="usa-width-one-third">
            <a className="usa-button usa-button-outline file-list-item-button" href={page.url}>
              {this.getButtonCopy(page)}
            </a>
          </div>
        </div>
      </li>
    );
  }
}

PageListItem.propTypes = propTypes;

export default PageListItem;
