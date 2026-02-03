import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

import BranchViewLink from './BranchViewLink';

import { SITE } from '@propTypes';

function BranchFilesLink({ branch }) {
  const href = `/sites/${branch.site.id}/published/${encodeURIComponent(branch.name)}`;
  return <Link to={href}>View files</Link>;
}

BranchFilesLink.propTypes = {
  branch: PropTypes.object,
};

export default function BranchRow({ branch, site }) {
  return (
    <tr key={branch.name}>
      <td>{branch.name}</td>
      <td>
        <ul className="usa-list--unstyled">
          <li>
            <BranchViewLink branchName={branch.name} site={site} />
          </li>
          <li>
            <BranchFilesLink branch={branch} />
          </li>
        </ul>
      </td>
    </tr>
  );
}

BranchRow.propTypes = {
  branch: PropTypes.object,
  site: SITE,
};
