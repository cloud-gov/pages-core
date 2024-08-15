import React, { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import PropTypes from 'prop-types';
import * as utils from '../../util/reports';
import * as datetime from '../../util/datetime';

import ScanFindingsSummary from './ScanFindingsSummary';
import About from './about';

export default function A11yScanIndex({ data, siteId, buildId }) {
  const scanTitle = 'Accessibility';
  const pageTitle = `Pages | ${scanTitle} scans report index for ${data.baseurl} on ${datetime.dateAndTimeSimple(data.reportPages[0].timestamp)} for build id #${buildId}`;
  const { id } = useParams();
  const reportId = parseInt(id, 10);

  const summarizedResults = [...data.violatedRules].map(result => ({
    ...result,
    name: result.description,
    ref: result.helpUrl,
    severity: utils.getSeverityThemeToken(result.impact, 'a11y'),
    count: result.total || result.nodes.length,
  })
  );

  const ignoreFn = finding => finding.ignore || (utils.getSeverityThemeToken(finding.impact, 'a11y') == null);
  const suppressed = summarizedResults.filter(ignoreFn);
  const unsuppressed = summarizedResults.filter(r => !ignoreFn(r));

  useEffect(() => {
    document.title = pageTitle;
  }, []);

  return (
    <>
      <div className="grid-row">
        <h1 className="font-heading-xl grid-col padding-right-2">
          Accessibility scan reports for
          {' '}
          <br />
          <span className="font-code-lg text-normal text-primary-darker bg-accent-cool-lighter padding-05 narrow-mono display-inline-block">
            {data.baseurl}
            {' '}
          </span>
          <span className="text-italic font-sans-lg text-normal margin-left-2">(all pages)</span>
        </h1>
        <span className="grid-col-auto inline-block margin-y-4">
          <a id="pages-logo" href="https://cloud.gov/pages" target="_blank" title="link to Pages homepage" rel="noreferrer">
            <img src="/images/logos/pages-logo-blue.svg" className="width-15" alt="Pages logo" />
          </a>
        </span>
      </div>
      <div className="grid-row">
        <div className="grid-col border-top-1px">
          <section
            className={`margin-top-4 usa-alert usa-alert--${data.violatedRules.length > 0 ? 'error' : 'success'}`}
          >
            <div className="usa-alert__body">
              <p className="usa-alert__text">
                {unsuppressed.length > 0 && (
                  <>
                    We’ve found
                    <b>
                      {`
                        ${unsuppressed.length} ${utils.plural(unsuppressed.length, 'unresolved issue')}
                        in ${data.totalViolationsCount} ${utils.plural(data.totalViolationsCount, 'place')}
                      `}
                    </b>
                    for this site.  View each page report below for specific details.
                  </>
                )}
                { (unsuppressed.length < 1 || summarizedResults.length < 1) && (
                  <>
                    We’ve found
                    <b>
                      {` ${summarizedResults.length} ${utils.plural(summarizedResults.length, 'resolved or informational result')} `}
                    </b>
                    for this site.
                  </>
                )}
              </p>
            </div>
          </section>
        </div>
      </div>
      <div className="grid-row">
        <div className="grid-col">
          <h3 className="font-heading-lg grid-col padding-right-2 margin-bottom-0 margin-top-4">
            All issues found
            {' '}
            <span className="font-body-lg text-secondary-vivid">
              (
              {data.violatedRules.length}
              )
            </span>
          </h3>
        </div>
      </div>
      <div className="grid-row">
        <div className="grid-col">
          <ScanFindingsSummary scanType="a11y" suppressedFindings={suppressed} unsuppressedFindings={unsuppressed} />
        </div>
      </div>
      <div className="grid-row">
        <div className="grid-col">
          <h3 className="font-heading-lg grid-col padding-right-2 margin-bottom-0 margin-top-1">
            All pages scanned
            {' '}
            <span className="font-body-lg text-accent-cool-darker">
              (
              {data.reportPages.length}
              )
            </span>
          </h3>
        </div>
      </div>
      <div className="grid-row">
        <div className="grid-col">
          <ScanResultsChildPages
            pages={data.reportPages}
            baseurl={data.baseurl}
            reportId={reportId}
          />
          <p className="font-body-2xs line-height-body-3">
            Results for
            {' '}
            <Link reloadDocument to={`/sites/${siteId}/builds/${buildId}/logs`} className="usa-link">
              build #
              {buildId}
            </Link>
            {' '}
            scanned on
            {' '}
            {datetime.dateAndTimeSimple(data.reportPages[0].timestamp)}
            .
          </p>
        </div>
      </div>
      <div className="grid-row">
        <div className="grid-col">
          <About scanType="a11y" siteId={siteId} />
        </div>
      </div>
    </>
  );
}

const IssuesCount = ({ violationsCount, indexPills, moreCount }) => {
  if (violationsCount < 1) return 'None';
  if (indexPills.length < 1) return violationsCount;
  return (
    <>
      {indexPills.map(pill => (
        <span key={pill.name} className={`usa-tag radius-pill bg-${utils.getSeverityThemeToken(pill.name, 'a11y').color} margin-right-1`}>
          {pill.count}
          {' '}
          {pill.name}
        </span>
      ))}
      {moreCount > 0 && (
        <b>
          +
          {moreCount}
          {' '}
          more
        </b>
      )}
    </>
  );
};

IssuesCount.propTypes = {
  violationsCount: PropTypes.number.isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  indexPills: PropTypes.array.isRequired,
  moreCount: PropTypes.number.isRequired,
};

const ScanResultsChildPages = ({ pages, reportId }) => (
  <table className="usa-table usa-table--striped usa-table--borderless usa-table--stacked usa-table--compact font-body-xs width-full" aria-label="Scan reports list with links to detailed reports">
    <thead>
      <tr>
        <th scope="col" className="width-full">Scanned URL</th>
        <th scope="col" className="text-no-wrap width-10"><span className="usa-sr-only">Open URL in new window</span></th>
        <th scope="col" className="text-no-wrap">Issues found</th>
        <th scope="col" className="text-right text-no-wrap">Scan results</th>
      </tr>
    </thead>
    <tbody>
      {pages.map(page => (
        <tr key={page.absoluteURL}>
          <th data-label="Scanned URL" scope="row">
            <b className="usa-sr-only">
              Scanned URL:
              <br />
            </b>
            {page.failed ? (
              <span className="font-body-2xs narrow-body text-bold text-error-dark">
                Couldn&apos;t process scan results. Please contact support.
                <br />
              </span>
            ) : (
              <span className="font-mono-2xs narrow-mono break-anywhere" aria-label={`dot slash ${page.path},`}>
                {page.absoluteURL}
              </span>
            )}
          </th>
          <td data-label="Link to open URL">
            {!page.failed && (
            <a className="usa-link font-body-3xs text-no-wrap" target="_blank" aria-label="open scanned URL in a new window," title="open scanned URL in a new window" href={page.absoluteURL} rel="noreferrer">
              open URL
              <svg className="usa-icon text-ttop" xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24">
                <path fill="currentColor" d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z" />
              </svg>
            </a>
            )}
          </td>
          <td data-label="Issues count" className="font-body-xs text-no-wrap">
            <b className="usa-sr-only">
              Issues:
              <br />
            </b>
            <IssuesCount {...page} />
          </td>
          <td data-label="Scan results" className="text-right">
            {page.failed ? (
              <span className="text-bold text-error-dark">Scan failed</span>
            ) : (
              <Link className="usa-link text-bold font-body-xs text-no-wrap" to={`/report/${reportId}/${page.path}/`} title={`Full results for ${page.absoluteURL}`} aria-label={`Full results for dot slash ${page.path},`}>
                View page report
              </Link>
            )}
          </td>
        </tr>
      ))}
    </tbody>
  </table>
);

ScanResultsChildPages.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  pages: PropTypes.array.isRequired,
  reportId: PropTypes.number.isRequired,
};

A11yScanIndex.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  data: PropTypes.object.isRequired,
  siteId: PropTypes.number.isRequired,
  buildId: PropTypes.number.isRequired,
};
