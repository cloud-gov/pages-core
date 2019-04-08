import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { SITE } from '../propTypes';
import { IconView } from './icons';

const isDefaultBranch = (branchName, site) => branchName === site.defaultBranch;
const isDemoBranch = (branchName, site) => branchName === site.demoBranch;

const getUrlAndViewText = (branchName, site, previewHostname) => {
  if (isDefaultBranch(branchName, site)) {
    return { url: site.viewLink, viewText: 'View site' };
  } else if (isDemoBranch(branchName, site)) {
    return { url: site.demoViewLink, viewText: 'View demo' };
  }
  return {
    url: `${previewHostname}/preview/${site.owner}/${site.repository}/${branchName}/`,
    viewText: 'Preview site',
  };
};

export const BranchViewLink = ({ branchName, site, previewHostname, showIcon }) => {
  const { url, viewText } = getUrlAndViewText(branchName, site, previewHostname);

  if (showIcon) {
    return (
      <a
        href={url} target="_blank"
        rel="noopener noreferrer"
        className="view-site-link"
      >
        { viewText }<IconView />
      </a>
    );
  }
  return (<a href={url} target="_blank" rel="noopener noreferrer">{ viewText }</a>);
};

BranchViewLink.propTypes = {
  branchName: PropTypes.string.isRequired,
  site: SITE.isRequired,
  previewHostname: PropTypes.string.isRequired,
  showIcon: PropTypes.bool,
};

BranchViewLink.defaultProps = {
  showIcon: false,
};

const mapStateToProps = state => ({
  previewHostname: state.FRONTEND_CONFIG.PREVIEW_HOSTNAME,
});

export default connect(mapStateToProps)(BranchViewLink);
