import React from 'react';
import LinkButton from '../../linkButton';

const propTypes = {
  pageName: React.PropTypes.string
};

const cssClasses = 'usa-button-outline file-list-item-button';

// FIXME: passing in the edit button text is clearly an abstraction failure.
const PageListItem = ({ pageName, href, editButtonText, children }) => (
  <li className="list-group-item">
    <div className="usa-grid">
      <div className="usa-width-two-thirds">{ pageName }</div>
      <div className="usa-width-one-third">
        <LinkButton href={ href }
                    className={ cssClasses }
                    text={ editButtonText } />
      </div>
    </div>
    { children }
  </li>);

PageListItem.propTypes = propTypes;

export default PageListItem;
