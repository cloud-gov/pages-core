import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

import api from '../../util/federalistApi';
import { IconBranch } from '../icons';
import LoadingIndicator from '../LoadingIndicator';
import { timeFrom, dateAndTime } from '../../util/datetime';

function buildShaLink(owner, repo, sha) {
  if (!owner || !repo || !sha) {
    return null;
  }

  const BASE = 'https://github.com';
  const baseHref = `${BASE}/${owner}/${repo}`;
  const linkHref = `${baseHref}/commit/${sha}`;
  return (
    <a
      className="sha-link"
      href={linkHref}
      title={sha}
      target="_blank"
      rel="noopener noreferrer"
    >
      {sha.slice(0, 7)}
    </a>
  );
}

function CommitSummary({ buildId }) {
  const [build, setBuild] = useState({
    isLoading: true,
    buildDetails: null,
  });
  const { isLoading, buildDetails } = build;

  useEffect(() => {
    if (!buildDetails) {
      api.fetchBuild(buildId).then(data => setBuild({
        isLoading: false,
        buildDetails: data,
      }));
    }
  }, [buildDetails]);

  if (isLoading) {
    return <LoadingIndicator size="mini" text="Getting commit details..." />;
  }

  return (
    <div className="commit-summary">
      <h3 className="commit-branch">
        <IconBranch />
        {' '}
        {buildDetails?.branch}
      </h3>
      <p className="commit-details">
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
          title={dateAndTime(buildDetails?.createdAt)}
        >
          {timeFrom(buildDetails?.createdAt)}
        </span>
      </p>
    </div>
  );
}
CommitSummary.propTypes = {
  buildId: PropTypes.number.isRequired,
};

export { CommitSummary };
export default CommitSummary;
