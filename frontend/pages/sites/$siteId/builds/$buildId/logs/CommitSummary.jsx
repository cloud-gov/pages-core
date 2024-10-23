import React from 'react';
import PropTypes from 'prop-types';

import { IconBranch } from '@shared/icons';
import LoadingIndicator from '@shared/LoadingIndicator';
import { timeFrom, dateAndTime } from '@util/datetime';

function buildShaLink(owner, repo, sha) {
  if (!owner || !repo || !sha) {
    return null;
  }

  const BASE = 'https://github.com';
  const baseHref = `${BASE}/${owner}/${repo}`;
  const linkHref = `${baseHref}/commit/${sha}`;
  return (
    <a
      className="sha-link font-mono-xs"
      href={linkHref}
      title={sha}
      target="_blank"
      rel="noopener noreferrer"
    >
      {sha.slice(0, 7)}
    </a>
  );
}

function CommitSummary({ buildDetails }) {
  if (!buildDetails) {
    return <LoadingIndicator size="mini" text="Getting commit details..." />;
  }

  return (
    <div className="commit-summary">
      <h3 className="commit-branch margin-bottom-1">
        <IconBranch className="usa-icon text-bottom" />
        {' '}
        {buildDetails?.branch}
      </h3>
      <p className="commit-details margin-top-1 margin-left-205">
        {buildShaLink(
          buildDetails?.site?.owner,
          buildDetails?.site?.repository,
          buildDetails?.clonedCommitSha
        )}
        &nbsp;by&nbsp;
        <b className="commit-username">{buildDetails?.username}</b>
        &nbsp;
        <span
          className="commit-time"
          title={dateAndTime(new Date(buildDetails?.createdAt))}
        >
          {timeFrom(new Date(buildDetails?.createdAt))}
        </span>
      </p>
    </div>
  );
}
CommitSummary.propTypes = {
  buildDetails: PropTypes.shape({
    site: PropTypes.shape({
      owner: PropTypes.string.isRequired,
      repository: PropTypes.string.isRequired,
    }).isRequired,
    branch: PropTypes.string.isRequired,
    username: PropTypes.string.isRequired,
    clonedCommitSha: PropTypes.string.isRequired,
    createdAt: PropTypes.string.isRequired,
  }),
};

CommitSummary.defaultProps = {
  buildDetails: null,
};

export { CommitSummary };
export default CommitSummary;
