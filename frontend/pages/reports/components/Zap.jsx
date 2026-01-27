import React, { useEffect } from 'react';
import PropTypes from 'prop-types';

import { severity, plural, getSeverityThemeToken } from '@util/reports';

import About from './about';
import ScanNav from './ScanNav';
import ScanFindings from './ScanFindings';
import ScanFindingsSummary from './ScanFindingsSummary';
import BackToTopButton from './BackToTopButton';
import GeneratedFor from './GeneratedFor';

export default function Zap({
  report,
  sbtCustomRules = [],
  buildId,
  siteId,
  sbtId,
  sbtType,
}) {
  const scanTitle = 'Vulnerability';
  // eslint-disable-next-line max-len
  const pageTitle = `Pages | ${scanTitle} report for ${report.site['@name']} on ${report.generated} for build id ${buildId}`;

  const navGroups = [...severity.zap].map((group) => ({
    ...group,
    usePill: true,
    count: report.site.groupedAlerts[group?.riskCode]?.length || 0,
  }));

  navGroups.push(
    {
      label: 'Total results',
      count: report.site.alerts?.length,
    },
    {
      label: 'All unsuppressed results',
      count: report.site?.issueCount,
      boldMe: true,
    },
  );

  const summarizedResults = [...report.site.alerts].map((result) => ({
    ...result,
    anchor: result.alertRef,
    severity: getSeverityThemeToken(result.riskcode, 'zap'),
    count: result.instances.length,
  }));

  const ignoreFn = (r) => r.ignore || r.riskcode < 1;
  const suppressed = summarizedResults.filter(ignoreFn);
  const unsuppressed = summarizedResults.filter((r) => !ignoreFn(r));

  const unsuppressedLocationCount = unsuppressed
    .map((i) => i.count)
    .reduce((a, b) => a + b, 0);

  useEffect(() => {
    document.title = pageTitle;
  }, []);

  return (
    <>
      <div className="grid-row">
        <h1 className="font-serif-xl grid-col padding-right-2">
          {scanTitle}
          {' report for '}
          <br />
          {/* eslint-disable-next-line max-len */}
          <span className="font-code-lg text-normal text-primary-darker bg-accent-cool-lighter padding-x-05r narrow-mono break-anywhere">
            {report.site['@name']}
          </span>
          <span className="text-italic font-sans-lg text-normal margin-left-2">
            (all pages)
          </span>
        </h1>
        <span className="grid-col-auto inline-block margin-y-4">
          <a
            id="pages-logo"
            href="https://cloud.gov/pages"
            target="_blank"
            rel="noopener noreferrer"
            title="link to Pages homepage"
          >
            <img
              src="/images/logos/pages-horizontal.svg"
              className="width-15"
              alt="Pages logo"
            />
          </a>
        </span>
      </div>
      <div className="grid-row border-top-1px padding-top-1">
        <section className="tablet:grid-col-auto">
          <ScanNav
            generated={report.generated}
            buildId={buildId}
            siteId={siteId}
            groups={navGroups}
          />
        </section>
        <div className="tablet:grid-col tablet:margin-left-4">
          <h2 className="usa-sr-only">Summary of results</h2>
          <div className="margin-y-4">
            <section
              className={`
                usa-alert
                usa-alert--${unsuppressed.length > 0 ? 'warning' : 'success'}
                margin-bottom-3
              `}
            >
              <div className="usa-alert__body">
                <p className="usa-alert__text">
                  {unsuppressed.length > 0 && (
                    <>
                      We’ve found
                      <b>
                        {`
                          ${unsuppressed.length}
                          ${plural(unsuppressed.length, 'unsuppressed result')}
                          in ${unsuppressedLocationCount}
                          ${plural(unsuppressedLocationCount, 'place')}
                        `}
                      </b>
                      across this site.
                    </>
                  )}
                  {(unsuppressed.length < 1 || summarizedResults.length < 1) && (
                    <>
                      We’ve found
                      <b>
                        {`
                          ${summarizedResults.length}
                          ${plural(
                            summarizedResults.length,
                            'suppressed or informational result',
                          )}
                        `}
                      </b>
                      for this site.
                    </>
                  )}
                </p>
              </div>
            </section>
            <ScanFindingsSummary
              baseurl={report.site['@name']}
              suppressedFindings={suppressed}
              unsuppressedFindings={unsuppressed}
            />
            <ScanFindings
              siteId={siteId}
              sbtId={sbtId}
              sbtType={sbtType}
              sbtCustomRules={sbtCustomRules}
              count={report.site.alerts.length}
              groupedFindings={report.site.groupedAlerts}
            />
          </div>
          <About scanType="zap" siteId={siteId}>
            <GeneratedFor
              siteId={siteId}
              buildId={buildId}
              url={report.site['@name']}
              timestamp={report.generated}
              topClass="line-height-body-3"
            />
          </About>
        </div>
      </div>
      <BackToTopButton />
    </>
  );
}

Zap.propTypes = {
  report: PropTypes.object.isRequired,
  sbtCustomRules: PropTypes.array,
  siteId: PropTypes.number.isRequired,
  sbtId: PropTypes.number.isRequired,
  sbtType: PropTypes.string.isRequired,
  buildId: PropTypes.number.isRequired,
};
