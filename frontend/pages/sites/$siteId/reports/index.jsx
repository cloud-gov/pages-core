import React from 'react';
import { useSearchParams, Link, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { setDate, isBefore, startOfToday, addMonths } from 'date-fns';

import { sandboxMsg } from '@util';
import { dateOnly } from '@util/datetime';
import { useSiteBuildTasks } from '@hooks/useSiteBuildTasks';
import { useBuildTasksForSite } from '@hooks/useBuildTasksForSite';
import { currentSite } from '@selectors/site';
import { getOrgById } from '@selectors/organization';

import LoadingIndicator from '@shared/LoadingIndicator';
import AlertBanner from '@shared/alertBanner';
import ExpandableArea from '@shared/ExpandableArea';
import ReportList from './ReportList';


function Reports() {
  const { id } = useParams();
  const site = useSelector(state => currentSite(state.sites, id));
  const organization = useSelector(state => getOrgById(state.organizations, site.organizationId));
  const { buildTasks: scans, isLoading } = useBuildTasksForSite(id);
  const { siteBuildTasks } = useSiteBuildTasks(id);
  const [searchParams, setSearchParams] = useSearchParams(false);
  const today = startOfToday();

  function nextScanDate(siteBuildTask) {
    if (!siteBuildTask.metadata.runDay) return null;
    const thisMonthScan = setDate(today, siteBuildTask.metadata.runDay);
    if (isBefore(thisMonthScan, today)) {
      return addMonths(thisMonthScan, 1);
    }
    return thisMonthScan;
  }

  if (!site || !scans) return null;
  const branchToBeScanned = site?.defaultBranch || 'most recently built';
  const buildIdToFilterBy = Number(searchParams.get('build'));
  // if filter isn't set or is not set to a valid build ID (positive int), show all
  const filteredScans = scans?.filter(scan => !buildIdToFilterBy || scan.buildId === buildIdToFilterBy);
  function clearParams() { setSearchParams({}); }

  return (
    <div>
      <div>
        { organization?.isSandbox
          && (
          <AlertBanner
            status="warning"
            message={sandboxMsg(organization.daysUntilSandboxCleaning, 'site reports')}
            alertRole={false}
          />
          )}
      </div>
      { isLoading
        ? <LoadingIndicator />
        : (
          <>
            <div>
              <p className="font-body-sm line-height-sans-4 measure-6 margin-bottom-4">
                Pages is now offering monthly Automated Site Reports, which examine your Pages site for common website issues and provide guidance and resources for remediation. You can request an immediate report for any recent site branch from
                {' '}
                <Link to={`/sites/${id}/builds`}>Build history</Link>
                . You can also customize your report results in
                {' '}
                <Link to={`/sites/${id}/settings`}>Site settings</Link>
                . For more information on Pages Automated Site Reports, check out the
                {' '}
                <a
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Pages documentation on reports"
                  href="https://cloud.gov/pages/documentation/build-scans/"
                >
                  docs
                </a>
                .
              </p>
              { siteBuildTasks.length > 0 && (
                <>
                  <h3 className="font-sans-lg">
                    Available report types (
                    {siteBuildTasks.length}
                    )
                  </h3>
                  { siteBuildTasks.map(task => (
                    <ExpandableArea
                      bordered
                      title={task.name}
                      key={task.id}
                    >
                      <div className="well">
                        <p>
                          Next scheduled for&nbsp;
                          <b>{dateOnly(nextScanDate(task))}</b>
                          &nbsp;on&nbsp;
                          <b>{branchToBeScanned}</b>
                        </p>
                        <p>
                          {`${task.description} For more information, refer to the `}
                          <Link to={task.url}>documentation</Link>
                          .
                        </p>
                      </div>
                    </ExpandableArea>
                  ))}
                </>
              )}

            </div>
            <br />
            <ReportList
              scans={scans}
              buildIdToFilterBy={buildIdToFilterBy}
              site={site}
              filteredScans={filteredScans}
              clearParams={clearParams}
            />
          </>
        )}
      <p>
        We welcome your feedback on this experimental feature. Email
        {' '}
        <a href="mailto:pages-support@cloud.gov?subject=Site%Reports%20feedback" target="_blank" rel="noreferrer">pages-support@cloud.gov</a>
        {' '}
        with the subject line “Reports feedback” to let us know what you think!
      </p>
    </div>
  );
}

export { Reports };
export default Reports;
