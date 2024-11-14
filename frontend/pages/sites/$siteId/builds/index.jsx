import React, { memo, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useParams, Link } from 'react-router-dom';
import { currentSite } from '@selectors/site';
import { getOrgById } from '@selectors/organization';
import { useBuilds } from '@hooks/useBuilds';
import AlertBanner from '@shared/alertBanner';
import QueryPage from '@shared/layouts/QueryPage';
import { sandboxMsg } from '@util';

import Build from './Build';

function scansDocsLink(url, cta = 'What’s this?') {
  return (
    <Link className="usa-link" target="_blank" to={url}>
      {cta}
    </Link>
  );
}

function siteHasBuildTasks(SiteBuildTasks = []) {
  return SiteBuildTasks.length > 0;
}

function SiteBuildList() {
  const ref = useRef();
  const { id } = useParams();
  const site = useSelector((state) => currentSite(state.sites, id));
  const organization = useSelector((state) =>
    getOrgById(state.organizations, site.organizationId),
  );

  const { data, error, isPending, isPlaceholderData } = useBuilds(id);

  return (
    <QueryPage
      data={data}
      dataHeader={'This site does not yet have any builds.'}
      dataMessage={
        'If this site was just added, ' +
        'the first build should be available within a few minutes.'
      }
      error={error}
      isPending={isPending}
      isPlaceholderData={isPlaceholderData}
    >
      <div className="grid-row">
        {organization?.isSandbox && (
          <div className="well">
            <AlertBanner
              status="warning"
              message={sandboxMsg(organization.daysUntilSandboxCleaning, 'site builds')}
              alertRole={false}
            />
          </div>
        )}
        <div ref={ref} className="grid-col-12 table-container">
          <table
            className={`
          usa-table
          usa-table--borderless
          usa-table--stacked
          log-table
          log-table__site-builds
          width-full
          table-full-width
      `}
          >
            <thead>
              <tr>
                <th scope="col">Build</th>
                <th scope="col">Branch</th>
                {siteHasBuildTasks(site.SiteBuildTasks) && (
                  <th scope="col">
                    Reports (
                    {scansDocsLink('https://cloud.gov/pages/documentation/build-scans/')})
                  </th>
                )}
                <th scope="col">Results</th>
              </tr>
            </thead>
            <tbody>
              {data.map(({ latestForBranch, ...build }) => {
                const SiteBuild = memo(Build, [build.state]);

                return (
                  <SiteBuild
                    build={build}
                    showBuildTasks={siteHasBuildTasks(site.SiteBuildTasks)}
                    latestForBranch={latestForBranch}
                    containerRef={ref}
                    site={site}
                    key={build.id}
                  />
                );
              })}
            </tbody>
          </table>
          <p>Showing {data?.length} most recent build(s).</p>
          {data?.length >= 100 && (
            <p>List only displays 100 most recent builds from the last 180 days.</p>
          )}
        </div>
      </div>
    </QueryPage>
  );
}

export { SiteBuildList };
export default SiteBuildList;
