import React, { memo, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useParams, Link } from 'react-router-dom';

import buildActions from '../../actions/buildActions';
import { currentSite } from '../../selectors/site';
import SiteBuildsBuild from './siteBuildsBuild';

import AlertBanner from '../alertBanner';

import { getOrgById } from '../../selectors/organization';
import { sandboxMsg } from '../../util';

export const REFRESH_INTERVAL = 1500 * 1000;

function scansDocsLink(url, cta = 'What’s this?') {
  return (
    <Link className="usa-link" target="_blank" to={url}>
      {cta}
    </Link>
  );
}
function latestBuildByBranch(builds) {
  const maxBuilds = {};
  const branchNames = [...new Set(builds.map(item => item.branch))];
  branchNames.forEach((branchName) => {
    const maxBuild = builds
      .filter(b => b.branch === branchName)
      .reduce((a, b) => (new Date(b.completedAt) > new Date(a.completedAt) ? b : a));
    maxBuilds[branchName] = maxBuild.id;
  });
  return maxBuilds;
}

function isLatest(build, builds) {
  return builds[build.branch] === build.id;
}

function siteHasBuildTasks(SiteBuildTasks = []) {
  return SiteBuildTasks.length > 0;
}

function SiteBuilds() {
  const { id } = useParams();
  const site = useSelector(state => currentSite(state.sites, id));
  const organization = useSelector(state => getOrgById(state.organizations, site.organizationId)
  );
  const builds = useSelector(state => state.builds);

  useEffect(() => {
    buildActions.fetchBuilds({ id });

    const intervalHandle = setInterval(() => {
      if (document.visibilityState === 'visible') {
        buildActions.refetchBuilds({ id });
      }
    }, REFRESH_INTERVAL);
    return () => {
      clearInterval(intervalHandle);
    };
  }, []);

  if (!builds?.isLoading && builds?.data?.length === 0) {
    const header = 'This site does not yet have any builds.';
    const message = 'If this site was just added, the first build should be available within a few minutes.';
    return (
      <AlertBanner status="info" header={header} message={message} />
    );
  }
  const latestBuilds = builds.data && latestBuildByBranch(builds.data);

  return (
    <div className="grid-row">
      {organization?.isSandbox && (
        <div className="well">
          <AlertBanner
            status="warning"
            message={sandboxMsg(
              organization.daysUntilSandboxCleaning,
              'site builds'
            )}
            alertRole={false}
          />
        </div>
      )}
      {builds?.data?.length > 0 && (
        <div className="grid-col-12 table-container">
          <table className="usa-table usa-table--borderless usa-table--stacked log-table log-table__site-builds width-full table-full-width">
            <thead>
              <tr>
                <th scope="col">Build</th>
                <th scope="col">Branch</th>
                {siteHasBuildTasks(site.SiteBuildTasks) && (
                  <th scope="col">
                    Reports (
                    {scansDocsLink(
                      'https://cloud.gov/pages/documentation/build-scans/'
                    )}
                    )
                  </th>
                )}
                <th scope="col">Results</th>
              </tr>
            </thead>
            <tbody>
              {builds.data.map((build) => {
                const SiteBuild = memo(SiteBuildsBuild, [build.state]);

                return (
                  <SiteBuild
                    build={build}
                    showBuildTasks={siteHasBuildTasks(site.SiteBuildTasks)}
                    latestForBranch={isLatest(build, latestBuilds)}
                    site={site}
                    key={build.id}
                  />
                );
              })}
            </tbody>
          </table>
          <p>
            Showing
            {' '}
            {builds.data.length}
            {' '}
            most recent build(s).
          </p>
          {builds.data.length >= 100 && (
            <p>
              List only displays 100 most recent builds from the last 180 days.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export { SiteBuilds };
export default SiteBuilds;
