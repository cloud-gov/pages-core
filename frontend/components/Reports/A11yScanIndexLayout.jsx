import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import * as utils from '../../util/reports';

import ScanFindingsSummary from './ScanFindingsSummary';
import About from './about';
import ScanAlert from './ScanAlert';

export default function A11yScanIndex({ data, siteId, buildId }) {
  const scanTitle = 'Accessibility';
  const pageTitle = `Pages | ${scanTitle} scan report for ${data.baseurl} on UNKNOWN DATE for build id ${buildId}`;

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
          Accessibility scan results for
          {' '}
          <br />
          <span className="font-code-lg text-normal text-primary-darker bg-accent-cool-lighter padding-05 narrow-mono display-inline-block">
            {data.baseurl}
            {' '}
            <span className="text-italic font-sans-lg text-normal">(all pages)</span>
          </span>
        </h1>
        <span className="grid-col-auto inline-block margin-y-4">
          <a id="pages-logo" href="https://cloud.gov/pages" target="_blank" title="link to Pages homepage" rel="noreferrer">
            <img src="/images/logos/pages-logo-blue.svg" className="width-15" alt="Pages logo" />
          </a>
        </span>
      </div>
      <div className="grid-row">
        <div className="grid-col border-top-1px">
          <h2 className="font-heading-xl margin-bottom-1 margin-top-3">Scan results summary</h2>
          <ScanAlert
            totalFound={data.violatedRules.length}
            totalLocations={data.totalViolationsCount}
            totalUrls={data.totalPageCount}
          >
            View each scan results page for specific details.
          </ScanAlert>
        </div>
      </div>
      <div className="grid-row">
        <div className="grid-col">
          <h3 className="font-heading-lg grid-col padding-right-2 margin-bottom-0 margin-top-4">
            All issues found
            &nbsp;
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
            &nbsp;
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
          <ScanResultsChildPages pages={data.reportPages} baseurl={data.baseurl} />
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

const ScanResultsChildPages = ({ pages }) => (
  <table className="usa-table usa-table--striped usa-table--borderless usa-table--stacked usa-table--compact font-body-xs width-full" aria-label="Scan results list with links to detailed reports">
    <thead>
      <tr>
        <th scope="col">Scanned URL</th>
        <th scope="col" className="text-no-wrap width-10"><span className="usa-sr-only">Open URL in new window</span></th>
        <th scope="col" className="text-no-wrap width-15 desktop:width-card-lg">Issues found</th>
        <th scope="col" className="text-right text-no-wrap width-10">Scan results</th>
      </tr>
    </thead>
    <tbody>
      {pages.map(page => (
        <tr key={pages.absoluteURL}>
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
              <a className="usa-link text-bold font-body-xs text-no-wrap" href={`./${page.path}`} title={`Full results for ${page.absoluteURL}`} aria-label={`Full results for dot slash ${page.path},`}>
                View page results
              </a>
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
};

A11yScanIndex.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  data: PropTypes.object.isRequired,
  siteId: PropTypes.number.isRequired,
  buildId: PropTypes.number.isRequired,
};