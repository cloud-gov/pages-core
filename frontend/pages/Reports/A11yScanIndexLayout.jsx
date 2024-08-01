import React from 'react';
import PropTypes from 'prop-types';
//import About from './about';
import * as utils from './utils'
import A11ySummaryTable from './A11ySummaryTable';
import A11yViolationsSection from './A11yViolationsSection';
import A11yPassedChecksSection from './A11yPassedChecksSection';
import ScanNav from './ZAPScanNav';
import ScanFindings from './ScanResults';
import ScanFindingsSummary from './ScanResultsSummary';
import BackToTopButton from './BackToTopButton';
import About from './about';

export default function A11yScanIndex({ data }) {
  console.log(data)


  let navGroups = [...utils.severity.a11y];

  return (
    <>
      <div className="grid-row">
        <h1 className="font-heading-xl grid-col padding-right-2">
          Accessibility scan results index for <br />
          <span className="font-code-lg text-normal text-primary-darker bg-accent-cool-lighter padding-x-05r narrow-mono">{data.baseurl}</span>
        </h1>
        <span className="grid-col-auto inline-block margin-y-4">
          <a id="pages-logo" href="https://cloud.gov/pages" target="_blank" title="link to Pages homepage">
            <img src="/images/logos/pages-logo-blue.svg" className="width-15" alt="Pages logo" />
          </a>
        </span>
      </div>
      <div className="grid-row border-top-1px padding-top-1">
        <section className="tablet:grid-col-auto">
          <ScanNav
            alerts={data.violatedRules}
            groupedAlerts={{}}
            site={{}}
            generated={''}
            buildId={''}
            scanType='a11y'
          />
        </section>
        <div className="tablet:grid-col tablet:margin-left-4">
          <div>
            <ScanFindingsSummary findings={[]} />
            <ScanFindings
              alerts={[]}
              groupedAlerts={{}}
              site={{}}
            />
          </div>
          <About scanType={'a11y'} siteId={'000'} />
        </div>
      </div>
      <BackToTopButton />
    </>
  );

  // return (
  //   <div>
  //     <About scanType='a11y' siteId="0"/>
  //     <pre>{JSON.stringify(data, null, "  ")}</pre>
  //   </div>
  // );
}

A11yScanIndex.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  data: PropTypes.object.isRequired,
};
