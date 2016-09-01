import React from 'react';
import PageListItem from './pageListItem';

import { pathHasDraft } from '../../../util/branchFormatter';

const propTypes = {
  site: React.PropTypes.object.isRequired
};

const NavigationJsonContent = ({ site }) => {
  const pagesConfigurationString = site["_navigation.json"].content;
  const pagesConfiguration = JSON.parse(pagesConfigurationString);
  const siteId = site.id;
  const defaultBranch = site.defaultBranch;

  return (
    <ul className="list-group">
      { emitPages(pagesConfiguration, siteId, defaultBranch) }
    </ul>
  );
};

const emitPages = (pages, siteId, defaultBranch) => {
  const emitPage = (page, index) => {
    const { title, permalink, href, children, path } = page;
    const pageListItemHref = getLinkFor(href, siteId, defaultBranch);

    return (
      <PageListItem
        key={ index }
        pageName={ title }
        href={ pageListItemHref }
        isPageDirectory={ false }
        hasDraft={ pathHasDraft(page.path, site.branches) }
      >
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

NavigationJsonContent.propTypes = propTypes;

export default NavigationJsonContent;
