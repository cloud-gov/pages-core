import React, { useEffect } from 'react';
import { useSelector, connect } from 'react-redux';

import PropTypes from 'prop-types';
import { IconBranch } from '../icons';
import LoadingIndicator from '../LoadingIndicator';

import buildActions from '../../actions/buildActions';
import { timeFrom, dateAndTime } from '../../util/datetime';

function buildShaLink(owner, repo, sha) {
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
      { sha.slice(0, 7) }
    </a>
  );
}

function CommitSummary({ buildId }) {
  const { isLoading, data: buildDetails } = useSelector(state => state.build);

  useEffect(() => {
    buildActions.fetchBuild(buildId);
  }, [buildId]);

  if (isLoading) {
    return (<LoadingIndicator size="mini" text="Getting commit details..." />);
  }

  return (
    (!isLoading && buildDetails && (
    <div className="commit-summary">
      <h3 className="commit-branch">
        <IconBranch />
        {' '}
        {buildDetails.branch}
      </h3>
      <p className="commit-details">
        {buildShaLink(
          buildDetails.site.owner,
          buildDetails.site.repository,
          buildDetails.clonedCommitSha
        )}
        &nbsp;by&nbsp;
        <b className="commit-username">{buildDetails.username}</b>
&nbsp;
        <span className="commit-time" title={dateAndTime(buildDetails.createdAt)}>
          { timeFrom(buildDetails.createdAt) }
        </span>
      </p>
    </div>
    ))
  );
}
CommitSummary.propTypes = {
  buildId: PropTypes.number.isRequired,
};

const mapStateToProps = ({ build }) => ({ build });

export { CommitSummary };
export default connect(mapStateToProps)(CommitSummary);
