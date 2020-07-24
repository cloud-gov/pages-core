import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { SITE } from '../propTypes';
import { IconView } from './icons';

const isDefaultBranch = (branchName, site) => branchName === site.defaultBranch;
const isDemoBranch = (branchName, site) => branchName === site.demoBranch;

const getViewText = (branchName, site) => {
  let viewText = 'Preview site';
  if (isDefaultBranch(branchName, site)) {
    viewText = 'View site';
  } else if (isDemoBranch(branchName, site)) {
    viewText = 'View demo';
  }
  return viewText;
};

export const BranchViewLink = ({
  branchName, viewLink, site, showIcon,
}) => {
  const viewText = getViewText(branchName, site);

  if (showIcon) {
    return (
      <a
        href={viewLink}
        target="_blank"
        rel="noopener noreferrer"
        className="view-site-link"
      >
        { viewText }
        <IconView />
      </a>
    );
  }
  return (<a href={viewLink} target="_blank" rel="noopener noreferrer">{ viewText }</a>);
};

BranchViewLink.propTypes = {
  branchName: PropTypes.string.isRequired,
  viewLink: PropTypes.string.isRequired,
  site: SITE.isRequired,
  showIcon: PropTypes.bool,
};

BranchViewLink.defaultProps = {
  showIcon: false,
};

export default connect()(BranchViewLink);
