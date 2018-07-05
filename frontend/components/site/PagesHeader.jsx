import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router';

import { IconView } from '../icons';
import GitHubLink from '../GitHubLink';

const PagesHeader = ({ owner, repository, title, viewLink }) => (
  <div className="page-header usa-grid-full">
    <div className="usa-width-two-thirds">
      <div className="header-title">
        <h1>
          {owner}/{repository}
        </h1>
      </div>
      <h2>{title}</h2>
    </div>
    <div className="usa-width-one-third header-actions">
      <GitHubLink text="View repo" owner={owner} repository={repository} />
      <Link
        role="button"
        alt="View this site"
        target="_blank"
        rel="noopener noreferrer"
        className="view-site-link"
        to={viewLink}
      >
        View site<IconView />
      </Link>
    </div>
  </div>
);

PagesHeader.propTypes = {
  owner: PropTypes.string.isRequired, // Owner (org or user) of the repo
  repository: PropTypes.string.isRequired, // Name of the repo
  title: PropTypes.string.isRequired, // Title of the section we are on
  viewLink: PropTypes.string.isRequired,
};

export default PagesHeader;
