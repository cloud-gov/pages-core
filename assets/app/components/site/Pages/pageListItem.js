import React from 'react';

const propTypes = {
  pageName: React.PropTypes.string
};

const PageListItem = ({pageName, children}) =>
  <li className="list-group-item">
    <div className="usa-grid">
      <div className="usa-width-two-thirds">
        {pageName}
      </div>
      <div className="usa-width-one-third">
        {children}
      </div>
    </div>
  </li>;

PageListItem.propTypes = propTypes;

export default PageListItem;
