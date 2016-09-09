import React from 'react';
import LinkButton from '../../linkButton';

const propTypes = {
  children: React.PropTypes.oneOf([
    React.PropTypes.object,
    React.PropTypes.array
  ]),
  hasDraft: React.PropTypes.bool,
  href: React.PropTypes.string,
  isPagesDirectory: React.PropTypes.bool,
  pageName: React.PropTypes.string.isRequired
};

const cssClasses = 'usa-button-outline file-list-item-button';
const getDraftBadge = (hasDraft) => {
  return hasDraft ? <span className="usa-label">Draft</span> : null;
}

const PageListItem = ({ pageName, hasDraft, href, isPageDirectory, children }) => (
  <li className="list-group-item">
    <div className="usa-grid">
      <div className="usa-width-two-thirds">
        { pageName }   { getDraftBadge(hasDraft) }
      </div>
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
