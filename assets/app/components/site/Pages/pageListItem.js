import React from 'react';
import LinkButton from '../../linkButton';

const propTypes = {
  pageName: React.PropTypes.string
};

const cssClasses = 'usa-button-outline file-list-item-button';

const PageListItem = ({ pageName, href, isPageDirectory, children }) => (
  <li className="list-group-item">
    <div className="usa-grid">
      <div className="usa-width-two-thirds">{ pageName }</div>
      <div className="usa-width-one-third">
        <LinkButton href={ href }
                    className={ cssClasses }
                    text={ getButtonText(isPageDirectory) } />
      </div>
    </div>
    { children }
  </li>);

const getButtonText = (isPageDirectory) => {
  return (isPageDirectory) ? 'Open' : 'Edit';
};

PageListItem.propTypes = propTypes;

export default PageListItem;
