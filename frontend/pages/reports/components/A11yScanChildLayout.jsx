import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import * as utils from '@util/reports';
import * as datetime from '@util/datetime';
import ScanNav from './ScanNav';
import ScanFindings from './ScanFindings';
import BackToTopButton from './BackToTopButton';
import About from './about';
import GeneratedFor from './GeneratedFor';

export default function A11yScanChild({
  report,
  sbtCustomRules = [],
  siteId,
  buildId,
  sbtId,
  sbtType,
}) {
  const scanTitle = 'Accessibility';
  // eslint-disable-next-line max-len
  const pageTitle = `Pages | ${scanTitle} report for ${report.url} on ${datetime.dateAndTimeSimple(report.timestamp)} for build id ${buildId}`;
  const allResults = Object.values(report.groupedViolations).flat(1);
  const ignoreFn = (finding) =>
    finding.ignore || utils.getSeverityThemeToken(finding.impact, 'a11y') == null;
  // const suppressed = allResults.filter(ignoreFn);
  const unsuppressed = allResults.filter((r) => !ignoreFn(r));
  const unsuppressedLocationCount = unsuppressed
    .map((i) => i.total)
    .reduce((a, b) => a + b, 0);

  const navGroups = [...utils.severity.a11y].map((group) => ({
    ...group,
    label: group.label,
    usePill: true,
    count: report.groupedViolations[group?.name]?.length || 0,
  }));

  navGroups.push(
    // TODO: split into suppressed/unsuppressed items
    {
      label: 'Total results',
      count: report?.violationsCount,
    },
    {
      label: 'All unsuppressed results',
      count: unsuppressed.length,
      boldMe: true,
    },
    {
      label: 'Total passes',
      count: report?.passes?.length,
    },
  );

  useEffect(() => {
    document.title = pageTitle;
  }, []);

  return (
    <>
      <div className="grid-row">
        <h1 className="font-serif-xl grid-col padding-right-2">
          Accessibility report for <br />
          {/* eslint-disable-next-line max-len */}
          <span className="font-code-lg text-normal text-primary-darker bg-accent-cool-lighter padding-x-05r narrow-mono break-anywhere">
            {report.url}
          </span>
          <span className="font-sans-lg text-normal margin-left-1">
            <a
              className="usa-link font-body-xs text-no-wrap margin-x-2"
              target="_blank"
              aria-label="open scanned page in a new window,"
              title="open scanned page in a new window"
              href={report.url}
              rel="noreferrer"
            >
              open page
              <svg
                className="usa-icon text-ttop"
                xmlns="http://www.w3.org/2000/svg"
                height="24"
                viewBox="0 0 24 24"
                width="24"
              >
                <path
                  fill="currentColor"
                  // eslint-disable-next-line max-len
                  d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"
                />
              </svg>
            </a>
          </span>
        </h1>
        <span className="grid-col-auto inline-block margin-y-4">
          <a
            id="pages-logo"
            href="https://cloud.gov/pages"
            target="_blank"
            title="link to Pages homepage"
            rel="noreferrer"
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
            generated={datetime.dateAndTimeSimple(report.timestamp)}
            buildId={buildId}
            siteId={siteId}
            groups={navGroups}
            showBackButton
          />
        </section>
        <div className="tablet:grid-col tablet:margin-left-4">
          <div className="margin-bottom-2 margin-top-4">
            <section
              className={`
                usa-alert
                usa-alert--${unsuppressed.length > 0 ? 'warning' : 'success'}
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
                          ${utils.plural(unsuppressed.length, 'unsuppressed result')}
                          in ${unsuppressedLocationCount}
                          ${utils.plural(unsuppressedLocationCount, 'place')}
                        `}
                      </b>
                      on this page.
                    </>
                  )}
                  {unsuppressed.length < 1 && (
                    <>
                      We’ve found
                      <b>{` ${unsuppressed.length} unsuppressed results `}</b>
                      on this page.
                    </>
                  )}
                </p>
              </div>
            </section>
          </div>
          <div>
            <ScanFindings
              siteId={siteId}
              sbtId={sbtId}
              sbtType={sbtType}
              sbtCustomRules={sbtCustomRules}
              count={report.violationsCount}
              groupedFindings={report.groupedViolations}
            />
          </div>
          <div>
            <A11yPassed passes={report.passes} />
            <hr />
            <About sbtType={sbtType} siteId={siteId}>
              <GeneratedFor
                siteId={siteId}
                buildId={buildId}
                url={report.url}
                timestamp={datetime.dateAndTimeSimple(report.timestamp)}
                topClass="line-height-sans-3"
              />
            </About>
          </div>
        </div>
      </div>
      <BackToTopButton />
    </>
  );
}

const A11yPassed = ({ passes = [] }) => (
  <div>
    <h3 className="font-serif-lg">
      Passed checks &nbsp;
      <span className="font-body-lg text-accent-cool-darker">({passes.length})</span>
    </h3>
    <details className="margin-y-3">
      <summary>
        This page passed <b>{passes.length}</b> WCAG accessibility{' '}
        {utils.plural(passes.length, 'check')}.
      </summary>
      <table
        className={`
          usa-table
          usa-table--striped
          usa-table--compact
          usa-table--borderless
          font-body-xs
          width-full
        `}
      >
        <thead>
          <tr>
            <th scope="col">Description</th>
            <th scope="col">Criteria</th>
            <th scope="col" className="text-right">
              Places found
            </th>
          </tr>
        </thead>
        <tbody>
          {passes.map((check) => (
            <tr key={check.help}>
              <th scope="row">{check.help}.</th>
              <td className="font-body-xs">
                {utils
                  .getSuccessCriteria(check)
                  .map((c) => c.short)
                  .join(', ')}
              </td>
              <td className="font-mono-sm text-tabular text-right">
                {check.nodes.length}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </details>
  </div>
);

A11yPassed.propTypes = {
  passes: PropTypes.array.isRequired,
};

A11yScanChild.propTypes = {
  report: PropTypes.object.isRequired,
  sbtCustomRules: PropTypes.array,
  siteId: PropTypes.number.isRequired,
  sbtId: PropTypes.number.isRequired,
  sbtType: PropTypes.string.isRequired,
  buildId: PropTypes.number.isRequired,
};
