import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router';

import GitHubRepoLink from '../GitHubRepoLink';


const propTypes = {
  owner: PropTypes.string.isRequired, // Owner (org or user) of the repo
  repository: PropTypes.string.isRequired, // Name of the repo
  title: PropTypes.string.isRequired, // Title of the section we are on
  viewLink: PropTypes.string.isRequired,
};

const PagesHeader = ({ owner, repository, title, viewLink }) => (
  <div className="usa-grid header">
    <div className="usa-width-two-thirds">
      <img
        className="header-icon"
        src="/images/website.svg"
        alt="Websites icon"
      />
      <div className="header-title">
        <h1>
          {owner}/{repository}
          &nbsp;<GitHubRepoLink owner={owner} repository={repository} />
        </h1>
        <h2>{title}</h2>
      </div>
    </div>
    <div className="usa-width-one-third">
      <Link
        role="button"
        className="usa-button pull-right icon icon-view icon-white"
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
