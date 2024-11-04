import React from 'react';
import PropTypes from 'prop-types';
import { SITE } from '@propTypes';
import globals from '@globals';

// Based on the site's related site branch configs and domains
// This function determines the link for a built branch
const getViewLink = (branch, site) => {
  const { awsBucketName, owner, repository, domains = [], siteBranchConfigs = [] } = site;
  const origin = `https://${awsBucketName}.${globals.PROXY_DOMAIN}`;
  const branchConfig = siteBranchConfigs.find((s) => s.branch === branch);

  // Checks to see if there is a site branch config
  // If not it returns the preview url
  if (!branchConfig) {
    return `${origin}/preview/${owner}/${repository}/${branch}`;
  }

  const domain = domains.find((d) => d.siteBranchConfigId === branchConfig.id);

  // Checks to see if there is a provisioned domain associated to the site branch config
  // If not it returns the preview url based on the S3 Key saved in the site branch config
  if (!domain || domain.state !== 'provisioned') {
    return `${origin}${branchConfig.s3Key}`;
  }

  // Returns the provisioned domain from the names attribute
  // Uses the first name if more then one name is associated to the Domain
  // ie. www.agency.gov,agency.gov
  return `https://${domain.names.split(',')[0]}`;
};

export const BranchViewLink = ({ branchName, site }) => {
  const domain = getViewLink(branchName, site);

  return (
    <a href={domain} target="_blank" rel="noopener noreferrer">
      View site preview
    </a>
  );
};

BranchViewLink.propTypes = {
  branchName: PropTypes.string.isRequired,
  site: SITE.isRequired,
};
export default BranchViewLink;
