import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import validBranchName from '../util/validators';
import { SITE } from '../propTypes';

const isDefaultBranch = (branchName, site) => branchName === site.defaultBranch;

const isDemoBranch = (branchName, site) => branchName === site.demoBranch;

// we only want to link branch names that are alphanumeric plus _, -, and .
const isLinkable = s => validBranchName(s);

const getUrlAndViewText = (branchName, site, previewHostname) => {
  if (isDefaultBranch(branchName, site)) {
    return { url: site.viewLink, viewText: 'View site' };
  } else if (isDemoBranch(branchName, site)) {
    return { url: site.demoViewLink, viewText: 'View demo' };
  }
  return {
    url: `${previewHostname}/preview/${site.owner}/${site.repository}/${branchName}/`,
    viewText: 'View preview',
  };
};

export const BranchViewLink = ({ branchName, site, previewHostname }) => {
  if (!isLinkable(branchName)) {
    return <span>Unlinkable branch name</span>;
  }

  const { url, viewText } = getUrlAndViewText(branchName, site, previewHostname);

  return (<a href={url} target="_blank" rel="noopener noreferrer">{ viewText }</a>);
};

BranchViewLink.propTypes = {
  branchName: PropTypes.string.isRequired,
  site: SITE.isRequired,
  previewHostname: PropTypes.string.isRequired,
};


const mapStateToProps = state => ({
  previewHostname: state.FRONTEND_CONFIG.PREVIEW_HOSTNAME,
});

export default connect(mapStateToProps)(BranchViewLink);
