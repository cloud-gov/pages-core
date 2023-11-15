import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { IconBranch } from '../icons';
import LoadingIndicator from '../LoadingIndicator';
import api from '../../util/federalistApi';
import { timeFrom, dateAndTime } from '../../util/datetime';


function CommitSummary({ buildId }) {
  const [{ isLoading, buildDetails }, setState] = useState({ isLoading: true, buildDetails: null });
    useEffect(() => {
      const fetchInitialData = async () => {
        const buildData = await api.fetchBuild(buildId);
        setState({ isLoading: false, buildDetails: buildData });
      };
      fetchInitialData();
    }, ['1']);

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
          >{ sha.slice(0,6) }</a>
      )
    }

  return (() => {
    if (isLoading) {
      return <LoadingIndicator />;
    }

    if (!buildDetails) {
      return (
      <p>No details available</p>
      );
    }
    return (
      <div class="commit-details">
        <h3><IconBranch /> {buildDetails.branch}</h3>
        <p>
          {buildShaLink( buildDetails.site.owner, buildDetails.site.repository, buildDetails.clonedCommitSha)}
          &nbsp;by&nbsp;
          <b>{buildDetails.username}</b>&nbsp;
          <span className="commit-time" title={dateAndTime(buildDetails.createdAt)}>
            { timeFrom(buildDetails.createdAt) }
          </span>
        </p>
      </div>
    );
  })()

};
CommitSummary.propTypes = {
  buildId: PropTypes.number.isRequired
};

export default CommitSummary;
