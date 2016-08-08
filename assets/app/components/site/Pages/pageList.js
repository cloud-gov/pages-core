import React from 'react';
import PageListItem from './pageListItem';

const pageList = ({ site, files }) => {
  return (
    <ul className="list-group">
      { emitPages(files, site) }
    </ul>
  );
};

const emitPages = (files, site) => {
  return files.map((page, index) => {
    const { id, branch, defaultBranch } = site;
    const href = getLinkFor(page, id, branch || defaultBranch);
    const isPageDirectory = isDir(page);
    return (
      <PageListItem key={ index } pageName={ page.name } href={ href }
                    isPageDirectory={ isPageDirectory }/>
    );
  });
};

const getLinkFor = (page, id, branch) => {
  const path = page.path;
  
  return isDir(page) ?
    `/sites/${id}/tree/${path}` : `/sites/${id}/edit/${branch}/${path}`;
};

const getButtonCopy = (page) => {
  return isDir(page) ? 'Open' : 'Edit';
};

const isDir = (page) => {
  return page.type === 'dir';
};

export default pageList;
