import React from 'react';
import PropTypes from 'prop-types';

export default function BranchFileRow({ file }) {
  let viewFileLink;
  const branch = file.publishedBranch.name;
  switch (branch) {
    case file.publishedBranch.site.defaultBranch:
      viewFileLink = `${file.publishedBranch.site.viewLink}${file.name}`;
      break;
    case file.publishedBranch.site.demoBranch:
      viewFileLink = `${file.publishedBranch.site.demoViewLink}${file.name}`;
      break;
    default:
      viewFileLink = `${file.publishedBranch.site.previewLink}${branch}/${file.name}`;
  }
  return (
    <tr key={viewFileLink}>
      <th scope="row">{file.name}</th>
      <td>
        <a href={viewFileLink} target="_blank" rel="noopener noreferrer">
          View
        </a>
      </td>
    </tr>
  );
}

BranchFileRow.propTypes = {
  file: PropTypes.object,
};
