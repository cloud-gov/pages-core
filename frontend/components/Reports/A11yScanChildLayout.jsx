import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import * as utils from '../../util/reports';
import * as datetime from '../../util/datetime';
import ScanNav from './ScanNav';
import ScanFindings from './ScanFindings';
import BackToTopButton from './BackToTopButton';
import About from './about';

export default function A11yScanChild({ data, siteId, buildId }) {
  const scanTitle = 'Accessibility';
  const pageTitle = `Pages | ${scanTitle} scan report for ${data.url} on ${datetime.dateAndTimeSimple(data.timestamp)} for build id ${buildId}`;

  const allResults = Object.values(data.groupedViolations).flat(1);
  const ignoreFn = finding => finding.ignore || (utils.getSeverityThemeToken(finding.impact, 'a11y') == null);
  // const suppressed = allResults.filter(ignoreFn);
  const unsuppressed = allResults.filter(r => !ignoreFn(r));
  const unsuppressedLocationCount = unsuppressed.map(i => i.total).reduce((a, b) => a + b, 0);

  const navGroups = [...utils.severity.a11y].map(group => ({
    ...group,
    label: group.label,
    usePill: true,
    count: data.groupedViolations[group?.name]?.length || 0,
  })
  );
  navGroups.push(
    // TODO: split into suppressed/unsuppressed items
    {
      label: 'Total results',
      count: data?.violationsCount,
    },
    {
      label: 'All unsuppressed results',
      count: unsuppressed.length,
      boldMe: true,
    },
    {
      label: 'Total passes',
      count: data?.passes?.length,
    }
  );

  useEffect(() => {
    document.title = pageTitle;
  }, []);

  return (
    <>
      <div className="grid-row">
        <h1 className="font-heading-xl grid-col padding-right-2">
          Accessibility scan report for
          {' '}
          <br />
          <span className="font-code-lg text-normal text-primary-darker bg-accent-cool-lighter padding-05 narrow-mono display-inline-block">{data.url}</span>
        </h1>
        <span className="grid-col-auto inline-block margin-y-4">
          <a id="pages-logo" href="https://cloud.gov/pages" target="_blank" title="link to Pages homepage" rel="noreferrer">
            <img src="/images/logos/pages-logo-blue.svg" className="width-15" alt="Pages logo" />
          </a>
        </span>
      </div>
      <div className="grid-row border-top-1px padding-top-1">
        <section className="tablet:grid-col-auto">
          <ScanNav
            generated={datetime.dateAndTimeSimple(data.timestamp)}
            buildId={buildId}
            siteId={siteId}
            groups={navGroups}
            showBackButton
          />
        </section>
        <div className="tablet:grid-col tablet:margin-left-4">
          <div className="margin-bottom-2 margin-top-4">
            <section
              className={`usa-alert usa-alert--${unsuppressed.length > 0 ? 'error' : 'success'}`}
            >
              <div className="usa-alert__body">
                <p className="usa-alert__text">
                  {unsuppressed.length > 0 && (
                    <>
                      We’ve found
                      <b>
                        {`
                          ${unsuppressed.length} ${utils.plural(unsuppressed.length, 'unsuppressed result')}
                          in ${unsuppressedLocationCount} ${utils.plural(unsuppressedLocationCount, 'place')}
                        `}
                      </b>
                      on this page.
                    </>
                  )}
                  { (unsuppressed.length < 1) && (
                    <>
                      We’ve found
                      <b>
                        {` ${unsuppressed.length} unsuppressed results `}
                      </b>
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
              scanType="a11y"
              count={data.violationsCount}
              groupedFindings={data.groupedViolations}
            />
          </div>
          <div>
            <A11yPassed passes={data.passes} />
            <hr />
            <About scanType="a11y" siteId={siteId}>
              <p className="font-body-xs line-height-body-3">
                This report was generated for
                {' '}
                <code className="narrow-mono font-mono-2xs bg-accent-cool-lighter">{data.url}</code>
                {' from '}
                <Link reloadDocument to={`/sites/${siteId}/builds/${buildId}/logs`} className="usa-link">
                  build #
                  {buildId}
                </Link>
                {' '}
                scanned on
                {' '}
                {datetime.dateAndTimeSimple(data.timestamp)}
              </p>
            </About>
          </div>
        </div>
      </div>
      <BackToTopButton />
    </>
  );
}

const A11yPassed = ({ passes }) => (
  <div>
    <h3 className="font-heading-lg">
      Passed checks &nbsp;
      <span className="font-body-lg text-accent-cool-darker">
        (
        {passes.length}
        )
      </span>
    </h3>
    <details className="margin-y-3">
      <summary>
        This page passed
        {' '}
        <b>{passes.length}</b>
        {' '}
        WCAG accessibility
        {' '}
        {utils.plural(passes.length, 'check')}
        .
      </summary>
      <table className="usa-table usa-table--striped usa-table--compact usa-table--borderless font-body-xs width-full">
        <thead>
          <tr>
            <th>Description</th>
            <th className="text-right">Places found</th>
          </tr>
        </thead>
        <tbody>
          {passes.map(check => (
            <tr key={check.help}>
              <td>
                {check.help}
                .
              </td>
              <td className="font-mono-sm text-tabular text-right">{check.nodes.length}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </details>

  </div>
);

A11yPassed.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  passes: PropTypes.array.isRequired,
};

A11yScanChild.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  data: PropTypes.object.isRequired,
  siteId: PropTypes.number.isRequired,
  buildId: PropTypes.number.isRequired,
};
