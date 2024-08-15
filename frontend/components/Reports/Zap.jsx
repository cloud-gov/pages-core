import React, { useEffect } from 'react';
import PropTypes from 'prop-types';

import About from './about';
import ScanNav from './ScanNav';
import ScanFindings from './ScanFindings';
import ScanFindingsSummary from './ScanFindingsSummary';
import BackToTopButton from './BackToTopButton';
import { severity, getSeverityThemeToken, plural } from '../../util/reports';

export default function Zap({ data, buildId, siteId }) {
  const scanTitle = 'Vulnerability';
  const pageTitle = `Pages | ${scanTitle} scan report for ${data.site['@name']} on ${data.generated} for build id ${buildId}`;

  const navGroups = [...severity.zap].map(group => ({
    ...group,
    usePill: true,
    count: data.site.groupedAlerts[group?.riskCode].length || 0,
  }));

  navGroups.push(
    {
      label: 'Total results',
      count: data.site.alerts?.length,
    },
    {
      label: 'All unresolved results',
      count: data.site?.issueCount,
      boldMe: true,
    }
  );

  const summarizedResults = [...data.site.alerts].map(result => ({
    ...result,
    anchor: result.alertRef,
    severity: getSeverityThemeToken(result.riskcode, 'zap'),
    count: result.instances.length,
  }));

  const ignoreFn = r => r.ignore || r.riskcode < 1;
  const suppressed = summarizedResults.filter(ignoreFn);
  const unsuppressed = summarizedResults.filter(r => !ignoreFn(r));

  const unsuppressedLocationCount = unsuppressed.map(i => i.count).reduce((a, b) => a + b, 0);

  useEffect(() => {
    document.title = pageTitle;
  }, []);

  return (
    <>
      <div className="grid-row">
        <h1 className="font-heading-xl grid-col padding-right-2">
          {scanTitle}
          {' scan report for '}
          <br />
          <span className="font-code-lg text-normal text-primary-darker bg-accent-cool-lighter padding-x-05r narrow-mono">
            {data.site['@name']}
          </span>
          <span className="text-italic font-sans-lg text-normal margin-left-2">(all pages)</span>
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
              src="/images/logos/pages-logo-blue.svg"
              className="width-15"
              alt="Pages logo"
            />
          </a>
        </span>
      </div>
      <div className="grid-row border-top-1px padding-top-1">
        <section className="tablet:grid-col-auto">
          <ScanNav
            generated={data.generated}
            buildId={buildId}
            siteId={siteId}
            groups={navGroups}
          />
        </section>
        <div className="tablet:grid-col tablet:margin-left-4">
          <div className="margin-top-4">
            <section
              className={`usa-alert usa-alert--${unsuppressed.length > 0 ? 'error' : 'success'}`}
            >
              <div className="usa-alert__body">
                <p className="usa-alert__text">
                  {unsuppressed.length > 0 && (
                    <>
                      We’ve found
                      <b>
                        {` ${unsuppressed.length} ${plural(unsuppressed.length, 'unresolved issue')} in ${unsuppressedLocationCount} ${plural(unsuppressedLocationCount, 'place')} `}
                      </b>
                      across this site.
                    </>
                  )}
                  { (unsuppressed.length < 1 || summarizedResults.length < 1) && (
                    <>
                      We’ve found
                      <b>
                        {` ${summarizedResults.length} ${plural(summarizedResults.length, 'resolved or informational result')} `}
                      </b>
                      for this site.
                    </>
                  )}
                </p>
              </div>
            </section>
            <ScanFindingsSummary
              scanType="zap"
              suppressedFindings={suppressed}
              unsuppressedFindings={unsuppressed}
            />
            <ScanFindings
              siteId={siteId}
              scanType="zap"
              count={data.site.alerts.length}
              groupedFindings={data.site.groupedAlerts}
            />
          </div>
          <About scanType="zap" siteId={siteId} />
        </div>
      </div>
      <BackToTopButton />
    </>
  );
}

Zap.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  data: PropTypes.object.isRequired,
  siteId: PropTypes.number.isRequired,
  buildId: PropTypes.number.isRequired,
};
