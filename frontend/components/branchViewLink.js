import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { SITE } from '../propTypes';
import { IconView } from './icons';

const isDefaultBranch = (branchName, site) => branchName === site.defaultBranch;
const isDemoBranch = (branchName, site) => branchName === site.demoBranch;

const getUrlAndViewText = (branchName, site) => {
  if (isDefaultBranch(branchName, site)) {
    return { url: site.viewLink, viewText: 'View site' };
  }
  if (isDemoBranch(branchName, site)) {
    return { url: site.demoViewLink, viewText: 'View demo' };
  }
  return {
    url: `https://${site.awsBucketName}.app.cloud.gov/preview/${site.owner}/${site.repository}/${branchName}/`,
    viewText: 'Preview site',
  };
};

export const BranchViewLink = ({ branchName, site, showIcon }) => {
  const { url, viewText } = getUrlAndViewText(branchName, site);

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

BranchViewLink.propTypes = {
  branchName: PropTypes.string.isRequired,
  site: SITE.isRequired,
  showIcon: PropTypes.bool,
};

BranchViewLink.defaultProps = {
  showIcon: false,
};

export default connect()(BranchViewLink);
