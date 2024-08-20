import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useParams, Link } from 'react-router-dom';

import buildActions from '../../actions/buildActions';
import { currentSite } from '../../selectors/site';
import LoadingIndicator from '../LoadingIndicator';
import RefreshBuildsButton from './refreshBuildsButton';
import SiteBuildsBuild from './siteBuildsBuild';

import AlertBanner from '../alertBanner';

import { getOrgById } from '../../selectors/organization';
import { sandboxMsg } from '../../util';

export const REFRESH_INTERVAL = 15 * 1000;

function scansDocsLink(url, cta = 'What’s this?') {
  return <Link className="usa-link" target="_blank" to={url}>{cta}</Link>;
}
function latestBuildByBranch(builds) {
  const maxBuilds = {};
  const branchNames = [...new Set(builds.map(item => item.branch))];
  branchNames.forEach((branchName) => {
    let successes = builds.filter(b => b.branch === branchName && b.state === 'success');
    successes = successes.sort((a, b) => (new Date(b.completedAt) - new Date(a.completedAt)));
    if (successes.length > 0) {
      maxBuilds[branchName] = successes[0].id;
    }
  });
  return maxBuilds;
}
function siteHasBuildTasks({ data, isLoading }) {
  return process.env.FEATURE_BUILD_TASKS === 'active' && !isLoading && data.some(build => build.BuildTasks?.length);
}

function SiteBuilds() {
  const { id } = useParams();
  const [autoRefresh, setAutoRefresh] = useState(false);
  const site = useSelector(state => currentSite(state.sites, id));
  const organization = useSelector(state => getOrgById(state.organizations, site.organizationId));
  const builds = useSelector(state => state.builds);

  let intervalHandle;
  useEffect(() => {
    buildActions.fetchBuilds({ id });
    intervalHandle = setInterval(() => {
      if (autoRefresh) {
        buildActions.fetchBuilds({ id });
      }
    }, REFRESH_INTERVAL);
    return () => {
      clearInterval(intervalHandle);
    };
  }, []);

  if (!builds.isLoading && !builds.data.length) {
    const header = 'This site does not yet have any builds.';
    const message = 'If this site was just added, the first build should be available within a few minutes.';
    return (
      <AlertBanner status="info" header={header} message={message}>
        <RefreshBuildsButton site={site} />
      </AlertBanner>
    );
  }
  const previewBuilds = builds.data && latestBuildByBranch(builds.data);

  return (
    <div>
      <div className="well">
        { organization?.isSandbox
          && (
          <AlertBanner
            status="warning"
            message={sandboxMsg(organization.daysUntilSandboxCleaning, 'site builds')}
            alertRole={false}
          />
          )}
      </div>
      <div className="log-tools">
        <div>
          {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
          <a
            href="#"
            role="button"
            onClick={() => setAutoRefresh(!autoRefresh)}
            data-test="toggle-auto-refresh"
          >
            Auto Refresh:
            {' '}
            <b>{autoRefresh ? 'ON' : 'OFF'}</b>
          </a>
          <RefreshBuildsButton site={site} />
        </div>
      </div>
      { builds.isLoading
        ? <LoadingIndicator />
        : (
          <div className="table-container">
            <table
              className="usa-table-borderless log-table log-table__site-builds table-full-width"
            >
              <thead>
                <tr>
                  <th scope="col">Build</th>
                  <th scope="col">Branch</th>
                  { siteHasBuildTasks(builds) && (
                    <th scope="col">
                      Reports
                      {' '}
                      (
                      {scansDocsLink('https://cloud.gov/pages/documentation/build-scans/')}
                      )
                    </th>
                  )}
                  <th scope="col">Results</th>

                </tr>
              </thead>
              <tbody>
                {builds.data.map(build => (
                  <SiteBuildsBuild
                    build={build}
                    showBuildTasks={siteHasBuildTasks(builds)}
                    previewBuilds={previewBuilds}
                    site={site}
                    key={build.id}
                  />
                ))}
              </tbody>
            </table>
            <p>
              Showing
              {' '}
              { builds.data.length }
              {' '}
              most recent build(s).
            </p>
            { builds.data.length >= 100
              ? <p>List only displays 100 most recent builds from the last 180 days.</p>
              : null }
          </div>
        )}
    </div>
  );
}

export { SiteBuilds };
export default SiteBuilds;
