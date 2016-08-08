import React from 'react';
import PageListItem from './pageListItem';

const editButtonText = "Edit";

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
  return emitPages(pageConfiguration, siteId, defaultBranch);
};

const emitPages = (pages, siteId, defaultBranch) => {
  const emitPage = (page, index) => {
    const { title, permalink, href, children } = page;
    const pageListItemHref = getLinkFor(href, siteId, defaultBranch);

    return (
      <PageListItem key={ index } pageName={ title } href={ pageListItemHref }
                    editButtonText={ editButtonText }>
        { emitChildren(children, siteId, defaultBranch) }
      </PageListItem>
    );
  };

  return pages.map(emitPage);
};

const getLinkFor = (href, siteId, defaultBranch) => {
  return `/sites/${siteId}/edit/${defaultBranch}/${href}`;
};

const emitChildren = (children, siteId, defaultBranch) => {
  if (children) {
    return (
      <ul className="list-group">
        { emitPages(children, siteId, defaultBranch) }
      </ul>
    );
  }
};

export default navigationJsonContent;
