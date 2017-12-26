import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router';

import GitHubLink from '../GitHubLink/GitHubLink';
import GitHubMark from '../GitHubMark';

const propTypes = {
  owner: PropTypes.string.isRequired, // Owner (org or user) of the repo
  repository: PropTypes.string.isRequired, // Name of the repo
  title: PropTypes.string.isRequired, // Title of the section we are on
  viewLink: PropTypes.string.isRequired,
};

const PagesHeader = ({ owner, repository, title, viewLink }) => (
  <div className="usa-grid header">
    <div className="usa-width-two-thirds">
      <div className="header-title">
        <h1>
          <img
            className="header-icon"
            src="/images/website.svg"
            alt="Websites icon"
          />
          {owner}/{repository}
          {' '}
        </h1>
      </div>
      <h2>{title}</h2>
    </div>
    <div className="usa-width-one-third header-actions">
      <GitHubLink owner={owner} repository={repository}>
        View repo
        <GitHubMark />
      </GitHubLink>
      <Link
        role="button"
        className="icon icon-view icon-white"
        alt="View this website"
        target="_blank"
        rel="noopener noreferrer"
        to={viewLink}
      >
        View Website
      </Link>
    </div>
  </div>
);

PagesHeader.propTypes = propTypes;

export default PagesHeader;
