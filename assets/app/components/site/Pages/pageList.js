import React from 'react';
import PageListItem from './pageListItem';

import { pathHasDraft } from '../../../util/branchFormatter';

const propTypes = {
  files: React.PropTypes.array,
  site: React.PropTypes.object.isRequired
};

const PageList = ({ site, files }) => {
  return (
    <ul className="list-group">
      { emitPages(files, site) }
    </ul>
  );
};

const emitPages = (files, site) => {
  return files.map((page, index) => {
    const { id, branch, branches, defaultBranch } = site;
    const pageLink = getLinkFor(page, id, branch || defaultBranch);
    const isPageDirectory = isDir(page);

    return (
      <PageListItem
        key={ index }
        pageName={ page.name }
        hasDraft={ pathHasDraft(page.path, site.branches) }
        href={ pageLink }
        isPageDirectory={ isPageDirectory }/>
    );
  });
};

const getLinkFor = (page, id, branch) => {
  const path = page.path;

  return isDir(page) ?
    `/sites/${id}/tree/${path}` : `/sites/${id}/edit/${branch}/${path}`;
};

const isDir = (page) => {
  return page.type === 'dir';
};

PageList.propTypes = propTypes;

export default PageList;
