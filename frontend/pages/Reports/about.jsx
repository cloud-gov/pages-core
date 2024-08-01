import React from 'react';
import PropTypes from 'prop-types';

export default function About({scanType}) {
  const poweredBy = scanType === "zap" ? 'ZAP' : 'axe-core';

  return (
    <section className="font-body-md line-height-body-5 margin-y-4">
      <h2 className="font-heading-lg">
        About this scan
      </h2>
      { scanType === "zap" ? <ZapAbout /> : <A11yAbout /> }
      <p>Pages will automatically suppress certain findings
          which are irrelevant for statically hosted websites or frequently produce ‘false
          positive’ findings for our customers.  While still visible in the report, the suppressed 
          findings don’t count towards your total issue count. Customers can specify additional 
          findings to be suppressed in future scans for this site in your Pages Site Settings.</p>
      <hr />
      <p className="font-body-xs">This scan is a service of <a href="https://cloud.gov/pages" target="_blank"
          className="usa-link">cloud.gov Pages</a>, powered by {poweredBy}. Check out the <a href="https://cloud.gov/pages/documentation/build-scans/" target="_blank" className="usa-link">documentation</a> for
        more information.
      </p>
    </section>
  );
}

const ZapAbout = () => {
  return (
    <>
      <p>
        According to <a className="usa-link" href="https://www.whitehouse.gov/omb/management/ofcio/delivering-a-digital-first-public-experience/#IIIA:~:text=Conduct%20regular%20security%20assessments%20and%20testing" target="_blank">OMB Memo 23-22</a>, agencies should follow and automate security best practices to ensure security is considered throughout all stages of the design and development lifecycle. OMB further directs agencies to  conduct regular security assessments when developing software or websites. Specifically, agencies should regularly assess the potential impact of a security incident on vital transactions or core services provided to the public, access to timely information, government and vital external operations, and public trust. <b>In addition to automated security scanning, agencies should perform manual penetration testing,</b> where appropriate, based on threat analysis and the criticality of the underlying system.
      </p>   
      <p>
        This scan uses the open source penetration testing tool Zed Attack Proxy (ZAP). The <a href="https://www.zaproxy.org/docs/docker/baseline-scan/" target="_blank" className="usa-link">ZAP Baseline security scan</a> passively scans your published website for common security vulnerabilities, but does not perform any attack or attempt to maliciously modify your site code. This scan may find evidence of issues such as the unintended exposure of sensitive data, SQL injection opportunities, cross-site scripting (XSS) flaws, and the use of components with known vulnerabilities.
      </p>
    </>
  )
}

const A11yAbout = () => {
   const rulesets = [
    "WCAG 2.0 Level A",
    "WCAG 2.0 Level AA",
    "WCAG 2.0 Level AAA",
    "WCAG 2.1 Level A",
    "WCAG 2.1 Level AA",
    "WCAG 2.2 Level AA",
   ];

  return (
    <>
      <p>
        According to <a className="usa-link" href="https://www.whitehouse.gov/omb/management/ofcio/delivering-a-digital-first-public-experience/#IIIA:~:text=Test%20for%20accessibility" target="_blank">OMB Memo 23-22</a>, in addition to the accessibility standards required by <a className="usa-link" href="https://www.section508.gov/" target="_blank">Section 508</a>, agencies should apply the most current <a className="usa-link" href="https://www.w3.org/WAI/standards-guidelines/" target="_blank">Web ContentAccessibility Guidelines (WCAG)</a> published by the World Wide Web Consortium (W3C) to websites and web applications,  where possible. This accessibility scan checks each webpage for violations of the latest WCAG version,  currently <b>WCAG 2.2 Level AA</b>, and includes the following rulesets:
      </p>
      <ul>
        {rulesets.map((rule, i) => {
          return (
            <li key={i}>
              { rule }
            </li>      
          )
        })} 
      </ul>
      <p>
        Descriptions of the rulesets are available in the <a
          href="https://github.com/dequelabs/axe-core/blob/develop/doc/rule-descriptions.md#rule-descriptions"
          target="_blank" className="usa-link">axe-core documentation</a>.
      </p>

      <p>
        This scan uses the open source axe-core project to identify common violations. With axe-core, you may expect to find a little over 55% of WCAG issues automatically. Please remember that <b>automated testing tools are limited and can only detect some accessibility issues</b>. Accessibility testing should include automated scanning, manual testing of websites, and usability testing with people with disabilities, as well as testing with users of adaptive technologies.
      </p>
    </>
  )
}
About.propTypes = {
  scanType: PropTypes.string.isRequired,
};
