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
import ScanAlert from './ScanAlert';

export default function A11yScanIndex({ data }) {
  console.log(data)

  function splitSuppressedResults(array, isValid) {
    return array.reduce(([pass, fail], elem) => {
        return isValid(elem) ? [[...pass, elem], fail] : [pass, [...fail, elem]];
      }, [[], []]);
    }

  let summarizedResults = [...data.violatedRules].map(result => ({
      ...result,
      name: result.description,
      ref: result.helpUrl,
      severity: utils.getSeverityThemeToken(result.impact, 'a11y'),
      count: result.total || result.nodes.length
    })
  );

  const [ suppressed, unsuppressed ] = splitSuppressedResults(summarizedResults, finding => finding.ignore || (utils.getSeverityThemeToken(finding.impact, 'a11y') == null) );


  return (
    <>
      <div className="grid-row">
        <h1 className="font-heading-xl grid-col padding-right-2">
          Accessibility scan results for <br />
          <span className="font-code-lg text-normal text-primary-darker bg-accent-cool-lighter padding-05 narrow-mono display-inline-block">{data.baseurl}/* <span className="text-italic font-sans-lg text-normal">(all pages)</span></span> 
        </h1>
        <span className="grid-col-auto inline-block margin-y-4">
          <a id="pages-logo" href="https://cloud.gov/pages" target="_blank" title="link to Pages homepage">
            <img src="/images/logos/pages-logo-blue.svg" className="width-15" alt="Pages logo" />
          </a>
        </span>
      </div>



      <div className="grid-row ">
        <div className="grid-col">
          <div>
            <h2 className="font-heading-xl margin-bottom-1 margin-top-3">Scan results summary</h2>
            <ScanAlert totalFound={data.violatedRules.length} totalLocations={data.totalViolationsCount} totalUrls={data.totalPageCount}> {unsuppressed.length} View each scan results page for specific details.</ScanAlert>
            <ScanFindingsSummary scanType={'a11y'} suppressedFindings={suppressed} unsuppressedFindings={unsuppressed} >

            </ScanFindingsSummary>
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
