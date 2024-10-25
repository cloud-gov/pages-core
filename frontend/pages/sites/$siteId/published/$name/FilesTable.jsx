import React from 'react';
import PropTypes from 'prop-types';

import globals from '@globals';

import BranchFileRow from './BranchFileRow';

export default function FilesTable({ files, name, children }) {
  return (
    <div>
      <h3>{name}</h3>
      <p>
        Use this page to audit the files that
        {` ${globals.APP_NAME} `}
        has publicly published.
        Up to 200 files are shown per page.
      </p>
      <table className="usa-table usa-table--borderless width-full usa-table--stacked log-table table-full-width">
        <thead>
          <tr>
            <th scope="col">File</th>
            <th scope="col">Actions</th>
          </tr>
        </thead>
        <tbody>
          { files.filter(f => !!f.name).map(file => (
            <BranchFileRow file={file} />
          ))}
        </tbody>
      </table>
      {children}
    </div>
  );
}

FilesTable.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  files: PropTypes.array,
  name: PropTypes.string,
  children: PropTypes.node,
};
