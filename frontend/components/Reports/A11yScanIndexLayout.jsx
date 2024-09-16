import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import * as utils from '../../util/reports';
import * as datetime from '../../util/datetime';

import ScanPagePathAndReportLink from './ScanPagePathReportLink';
import ScanFindingsSummary from './ScanFindingsSummary';
import About from './about';

export default function A11yScanIndex({ data, siteId, buildId }) {
  const scanTitle = 'Accessibility';
  const pageTitle = `Pages | ${scanTitle} report index for ${data.baseurl} on ${datetime.dateAndTimeSimple(data.reportPages[0].timestamp)} for build id #${buildId}`;
  function findReportsPerURLs(url) {
    return data.reportPages.find(page => page.absoluteURL === url)?.path || '';
  }
  const summarizedResults = [...data.violatedRules].map(result => ({
    ...result,
    name: result.help,
    ref: result.helpUrl,
    severity: utils.getSeverityThemeToken(result.impact, 'a11y'),
    count: result.urls.length,
    reports: result.urls.map(url => findReportsPerURLs(url)),
  }));

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
          Accessibility reports for
          {' '}
          <br />
          <span className="font-code-lg text-normal text-primary-darker bg-accent-cool-lighter padding-x-05r narrow-mono break-anywhere">
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
            className={`margin-top-4 usa-alert usa-alert--${unsuppressed.length > 0 ? 'error' : 'success'}`}
          >
            <div className="usa-alert__body">
              <p className="usa-alert__text">
                We’ve found
                <b>
                  {`
                    ${unsuppressed.length} ${utils.plural(unsuppressed.length, 'unsuppressed result')}
                  `}
                </b>
                and
                <b>
                  {` ${suppressed.length} ${utils.plural(suppressed.length, 'suppressed or informational result')} `}
                </b>
                for this site.  View each page report below for specific details.
              </p>
            </div>
          </section>
        </div>
      </div>
      <div className="grid-row">
        <div className="grid-col">
          <h2 className="font-heading-xl grid-col padding-right-2 margin-bottom-0 padding-top-2 margin-top-2">
            All results
            {' '}
            <span className="font-body-lg text-secondary-vivid">
              (
              {data.violatedRules.length}
              )
            </span>
          </h2>
        </div>
      </div>
      <div className="grid-row">
        <div className="grid-col">
          <ScanFindingsSummary
            baseurl={data.baseurl}
            suppressedFindings={suppressed}
            unsuppressedFindings={unsuppressed}
          />
        </div>
      </div>
      <div className="grid-row">
        <div className="grid-col">
          <h2 className="font-heading-xl grid-col padding-right-2 margin-bottom-0 margin-top-1">
            All reports
            {' '}
            <span className="font-body-lg text-accent-cool-darker">
              (
              {data.reportPages.length}
              )
            </span>
          </h2>
        </div>
      </div>
      <div className="grid-row">
        <div className="grid-col">
          <ScanResultsChildPages
            pages={data.reportPages}
            baseurl={data.baseurl}
          />
          <p className="font-body-2xs line-height-body-3">
            This report was generated for
            {' '}
            <Link reloadDocument to={`/sites/${siteId}/builds/${buildId}/logs`} className="usa-link">
              build #
              {buildId}
            </Link>
            {' '}
            scanned on
            {' '}
            {datetime.dateAndTimeSimple(data.reportPages[0]?.timestamp)}
            .
          </p>
        </div>
      </div>
      <div className="grid-row">
        <div className="grid-col">
          <About scanType="a11y" siteId={siteId}>
            <p className="font-body-xs line-height-body-3">
              This report was generated for
              {' '}
              <code className="narrow-mono font-mono-2xs bg-accent-cool-lighter">{data.baseurl}</code>
              {' from '}
              <Link reloadDocument to={`/sites/${siteId}/builds/${buildId}/logs`} className="usa-link">
                build #
                {buildId}
              </Link>
              {' '}
              scanned on
              {' '}
              {datetime.dateAndTimeSimple(data.reportPages[0]?.timestamp)}
            </p>
          </About>
        </div>
      </div>
    </>
  );
}

const IssuesCount = ({ violationsCount = 0, indexPills = [], moreCount = 0 }) => {
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

const ScanResultsChildPages = ({ pages = [], baseurl }) => (
  <table className="usa-table usa-table--striped usa-table--borderless usa-table--stacked usa-table--compact font-body-xs width-full" aria-label="Page list with links to detailed reports">
    <thead>
      <tr>
        <th scope="col" className="width-full">Page scanned</th>
        <th scope="col" className="text-no-wrap text-right">Findings</th>
      </tr>
    </thead>
    <tbody>
      {pages.map(page => (
        <tr key={page.absoluteURL} id={`jump-to-${utils.relPath(page.absoluteURL, baseurl)}`}>
          <th data-label="Scanned URL" scope="row">
            <b className="usa-sr-only">
              Page scanned:
              <br />
            </b>
            {page.failed ? (
              <>
                <span className="font-mono-2xs margin-right-1">
                  {utils.relPath(page.absoluteURL, baseurl)}
                </span>
                <span className="font-body-2xs narrow-body text-bold text-error-dark">
                  Couldn&apos;t process report results. Please contact support.
                  <br />
                </span>
              </>
            ) : (
              <ScanPagePathAndReportLink
                pagePath={utils.relPath(page.absoluteURL, baseurl)}
                pageURL={page.absoluteURL}
                reportLink={page.path}
              />
            )}
          </th>
          <td data-label="Results count" className="font-body-xs text-no-wrap text-right">
            <b className="usa-sr-only">
              Findings:
              <br />
            </b>
            <IssuesCount {...page} />
          </td>
        </tr>
      ))}
    </tbody>
  </table>
);

ScanResultsChildPages.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  pages: PropTypes.array.isRequired,
  baseurl: PropTypes.string,
};

A11yScanIndex.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  data: PropTypes.object.isRequired,
  siteId: PropTypes.number.isRequired,
  buildId: PropTypes.number.isRequired,
};
