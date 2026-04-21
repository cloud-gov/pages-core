import React from 'react';
import PropTypes from 'prop-types';

import SourceCodePlatformLink from '@shared/SourceCodePlatformLink';

const PagesHeader = ({ owner, repository, title, sourceCodePlatform, sourceCodeUrl }) => (
  <div className="page-header grid-row flex-align-center">
    <div className="desktop:grid-col-fill grid-col-12">
      <div className="header-title">
        <h1 className="font-sans-lg margin-top-3">{`${owner}/${repository}`}</h1>
      </div>
    </div>
    <div className="desktop:grid-col-auto grid-col-12 header-actions margin-right-neg-1">
      <SourceCodePlatformLink
        textGitHub="View repo"
        textGitLab="View project"
        sourceCodePlatform={sourceCodePlatform}
        sourceCodeUrl={sourceCodeUrl}
        isButton
      />
    </div>
    <div className="grid-col-12">
      {title && <h2 className="font-sans-2xl margin-y-2">{title}</h2>}
    </div>
  </div>
);

PagesHeader.propTypes = {
  owner: PropTypes.string.isRequired, // Owner (org or user) of the repo
  repository: PropTypes.string.isRequired, // Name of the repo
  title: PropTypes.string.isRequired, // Title of the section we are on
  sourceCodePlatform: PropTypes.string.isRequired,
  sourceCodeUrl: PropTypes.string.isRequired,
};

export default PagesHeader;
