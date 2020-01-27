import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { SITE } from '../propTypes';
import { IconView } from './icons';

const isDefaultBranch = (branchName, site) => branchName === site.defaultBranch;
const isDemoBranch = (branchName, site) => branchName === site.demoBranch;

const getUrlAndViewText = (branchName, viewLink, site, completedAt) => {
  let viewText = 'Preview site';
  if (isDefaultBranch(branchName, site)) {
    viewText = 'View site';
  } else if (isDemoBranch(branchName, site)) {
    viewText = 'View demo';
  }
  return { url: viewLink, viewText };
};

export const BranchViewLink = ({ branchName, viewLink, site, showIcon, completedAt }) => {
  const { url, viewText } = getUrlAndViewText(branchName, viewLink, site, completedAt);

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
  viewLink: PropTypes.string.isRequired,
  site: SITE.isRequired,
  showIcon: PropTypes.bool,
  completedAt: PropTypes.string,
};

BranchViewLink.defaultProps = {
  showIcon: false,
  completedAt: null,
};

export default connect()(BranchViewLink);
