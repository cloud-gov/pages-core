import React from 'react';
import PageListItem from './pageListItem';
import LinkButton from '../../linkButton';

const editButtonText = "Edit";
const cssClasses = 'usa-button-outline file-list-item-button';

const navigationJsonContent = ({site}) => {
  const pagesConfigurationString = site["_navigation.json"].content;
  const pagesConfiguration = JSON.parse(pagesConfigurationString);
  const siteId = site.id;
  const defaultBranch = site.defaultBranch;

  return (
    <ul className="list-group">
      { emitPagesConfiguration(pagesConfiguration, siteId, defaultBranch) }
    </ul>
  );
};

const emitPagesConfiguration = (pageConfiguration, siteId, defaultBranch) => {
  return pageConfiguration.map((page, index) => {
    const { title, permalink, href } = page;
    
    return (
      <PageListItem key={ index } pageName={ title }>
        <LinkButton href={getLinkFor(href, siteId, defaultBranch)}
                    className={ cssClasses }
                    text={ editButtonText } />
      </PageListItem>
    );
  });
};

const getLinkFor = (href, siteId, defaultBranch) => {
  return `/sites/${siteId}/edit/${defaultBranch}/${href}`;
};

export default navigationJsonContent;
