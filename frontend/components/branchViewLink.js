import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { SITE } from '../propTypes';
import { IconView } from './icons';

const isDefaultBranch = (branchName, site) => branchName === site.defaultBranch;
const isDemoBranch = (branchName, site) => branchName === site.demoBranch;

const getUrlAndViewText = (branchName, buildURL, site, completedAt) => {
  if (isDefaultBranch(branchName, site)) {
    return { url: site.viewLink, viewText: 'View site' };
  }
  if (isDemoBranch(branchName, site)) {
    return { url: site.demoViewLink, viewText: 'View demo' };
  }

  return {
    url: `https://${buildURL}/`,
    viewText: 'Preview site',
  };
};

export const BranchViewLink = ({ branchName, buildURL, site, showIcon, completedAt }) => {
  const { url, viewText } = getUrlAndViewText(branchName, buildURL, site, completedAt);

  if (showIcon) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="view-site-link"
      >
        { viewText }
        <IconView />
      </a>
    );
  }
  return (<a href={url} target="_blank" rel="noopener noreferrer">{ viewText }</a>);
};

// Note: remove completedAt propType from compoent at end of 2018
BranchViewLink.propTypes = {
  branchName: PropTypes.string.isRequired,
  buildURL: PropTypes.string.isRequired,
  site: SITE.isRequired,
  showIcon: PropTypes.bool,
  completedAt: PropTypes.string,
};

BranchViewLink.defaultProps = {
  showIcon: false,
  completedAt: null,
};

export default connect()(BranchViewLink);
