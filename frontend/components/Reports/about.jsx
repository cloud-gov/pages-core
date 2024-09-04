/* eslint-disable max-len */
import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

export default function About({ scanType, siteId, children }) {
  return (
    <section className="usa-prose margin-y-4 maxw-tablet-lg">
      <h2>
        About this report
      </h2>
      <div className="font-body-md line-height-body-5">
        { scanType === 'zap' ? <ZapAbout /> : <A11yAbout /> }
        <h3>Suppressed results</h3>
        <p>
          Pages may automatically suppress certain results
          which are irrelevant for statically hosted websites, based on unconfigurable server settings,
          or frequently produce “false positives” for our customers.  While still visible in the report,
          the suppressed results don’t count towards your total issue count. Customers can specify additional
          criteria to be suppressed in future reports for this site in your Pages
          {' '}
          <Link reloadDocument to={`/sites/${siteId}/settings`} className="usa-link">Site Settings</Link>
          .
        </p>
        <hr />
        {children}
      </div>
    </section>
  );
}

const ZapAbout = () => (
  <>
    <p>
      According to
      {' '}
      <a className="usa-link" href="https://www.whitehouse.gov/omb/management/ofcio/delivering-a-digital-first-public-experience/#IIIA:~:text=Conduct%20regular%20security%20assessments%20and%20testing" target="_blank" rel="noreferrer">OMB Memo 23-22</a>
      , agencies should follow and automate security best practices to ensure security is
      considered throughout all stages of the design and development lifecycle. OMB further
      directs agencies to  conduct regular security assessments when developing software or
      websites. Specifically, agencies should regularly assess the potential impact of a
      security incident on vital transactions or core services provided to the public, access
      to timely information, government and vital external operations, and public trust.
      {' '}
      <b>
        In addition to automated security scanning, agencies should perform manual penetration
        testing,
      </b>
      {' '}
      where appropriate, based on threat analysis and the criticality of the underlying system.
    </p>
    <p>
      This report uses the open source penetration testing tool Zed Attack Proxy (ZAP). The
      {' '}
      <a href="https://www.zaproxy.org/docs/docker/baseline-scan/" target="_blank" className="usa-link" rel="noreferrer">ZAP Baseline security scan</a>
      {' '}
      passively scans your published website for common security vulnerabilities, but does
      not perform any attack or attempt to maliciously modify your site code. This report may
      find evidence of issues such as the unintended exposure of sensitive data, SQL injection
      opportunities, cross-site scripting (XSS) flaws, and the use of components with known
      vulnerabilities.
    </p>
    <h3>Result severity level</h3>
    <p>
      The Pages ZAP report follows the OWASP Risk Rating Methodology to estimate the severity of identified issues by evaluating their likelihood of exploitation and their potential impact. However, the actual cybersecurity threat could be lower or higher. Therefore, it is important for agencies to assess each individual finding and evaluate the real risk within the contest of the specific websites and organization. These are general guidelines and&nbsp;
      <a
        href="https://owasp.org/www-community/OWASP_Risk_Rating_Methodology"
        target="_blank"
        className="usa-link"
        rel="noreferrer"
      >
        determining risk is subjective
      </a>
      . Agency website maintainers, rather than OWASP or Pages, are best positioned to decide how to triage and address report findings.
    </p>
    <table className="usa-table usa-table--borderless ">
      <thead>
        <tr>
          <th scope="col">Severity</th>
          <th scope="col">Description</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <th scope="row">
            <span className="usa-tag--big usa-tag text-uppercase radius-pill bg-risk-high margin-0 display-inline">High risk</span>
          </th>
          <td>
            High severity vulnerabilities usually pose a significant risk to application security or can be easily exploited, leading to critical consequences such as unauthorized access, data loss, or system compromise.
          </td>
        </tr>
        <tr>
          <th scope="row">
            <span className="usa-tag--big usa-tag text-uppercase radius-pill bg-risk-medium margin-0 display-inline">Medium risk</span>
          </th>
          <td>
            Medium severity vulnerabilities may expose the application to serious risks such as sensitive data exposure or unauthorized actions by malicious actors, due to the ease of exploitation or sophistication of the attack.
          </td>
        </tr>
        <tr>
          <th scope="row">
            <span className="usa-tag--big usa-tag text-uppercase radius-pill bg-risk-low margin-0 display-inline">Low risk</span>
          </th>
          <td>
            Low severity vulnerabilities present clear risk to the security of the web application but may not have a catastrophic impact on overall security or may be more difficult (but not impossible) to exploit.
          </td>
        </tr>
        <tr>
          <th scope="row">
            <span className="usa-tag--big usa-tag text-uppercase radius-pill bg-risk-info margin-0 display-inline">Informational</span>
          </th>
          <td>
            Informational findings provide general insights or about the configuration, architecture, behavior, and exploitability of the web application, but do not directly indicate any security vulnerabilities.
          </td>
        </tr>
      </tbody>
    </table>

    <p>
      More information about the mechanism powering this report is available in the
      {' '}
      <a
        href="https://www.zaproxy.org/docs/"
        target="_blank"
        className="usa-link"
        rel="noreferrer"
      >
        ZAP documentation
      </a>
      .
    </p>
    <hr />
  </>
);

const A11yAbout = () => {
  const rulesets = [
    'WCAG 2.0 Level A',
    'WCAG 2.0 Level AA',
    'WCAG 2.0 Level AAA',
    'WCAG 2.1 Level A',
    'WCAG 2.1 Level AA',
    'WCAG 2.2 Level AA',
  ];

  return (
    <>
      <p>
        According to
        {' '}
        <a className="usa-link" href="https://www.whitehouse.gov/omb/management/ofcio/delivering-a-digital-first-public-experience/#IIIA:~:text=Test%20for%20accessibility" target="_blank" rel="noreferrer">OMB Memo 23-22</a>
        , in addition to the accessibility standards required by
        {' '}
        <a className="usa-link" href="https://www.section508.gov/" target="_blank" rel="noreferrer">Section 508</a>
        , agencies should apply the most current
        {' '}
        <a className="usa-link" href="https://www.w3.org/WAI/standards-guidelines/" target="_blank" rel="noreferrer">Web Content Accessibility Guidelines (WCAG)</a>
        {' '}
        published by the World Wide Web Consortium (W3C) to websites and web applications,
        where possible. This accessibility report checks each webpage for violations of the latest
        WCAG version,  currently
        {' '}
        <b>WCAG 2.2 Level AA</b>
        , and includes the following rulesets:
      </p>
      <ul>
        {rulesets.map(rule => (
          <li key={rule}>
            { rule }
          </li>
        ))}
      </ul>
      <p>
        This report uses the open source axe-core project to identify common violations.
        With axe-core, you may expect to find a little over 55% of WCAG issues automatically.
        Please remember that
        {' '}
        <b>automated testing tools are limited and can only detect some accessibility issues</b>
        . Accessibility testing should include automated scanning, manual testing of websites,
        and usability testing with people with disabilities, as well as testing with users of
        adaptive technologies.
      </p>
      <h3>Result severity level</h3>
      <p>
        Axe-core distinguishes the severity of results by the likely impact of the issue on a user with a relevant disability. In any given situation, the actual, experienced impact for a user could be lower or higher. It’s essential for agencies to evaluate each individual result and assess the actual impact in the context of their website or content. The given severity levels are&nbsp;
        <a
          href="https://github.com/dequelabs/axe-core/blob/develop/doc/issue_impact.md"
          target="_blank"
          className="usa-link"
          rel="noreferrer"
        >
          defined by axe-core
        </a>
        , not Pages, but may prove useful in triaging and addressing the results.&nbsp;
        <b>
          Regardless of the severity, every result is an accessibility challenge that can and should be remediated by the website maintainer.
        </b>
      </p>
      <table className="usa-table usa-table--borderless ">
        <thead>
          <tr>
            <th scope="col">Severity</th>
            <th scope="col">Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row">
              <span className="usa-tag--big usa-tag text-uppercase radius-pill bg-risk-high margin-0 display-inline">Critical</span>
            </th>
            <td>
              A “Critical” result indicates an issue that may entirely block access to the website content or controls for people with disabilities, prohibiting users from accomplishing fundamental tasks.
            </td>
          </tr>
          <tr>
            <th scope="row">
              <span className="usa-tag--big usa-tag text-uppercase radius-pill bg-risk-medium margin-0 display-inline">Serious</span>
            </th>
            <td>
              A “Serious” result indicates an issue that may present a significant, frustrating barrier for people with disabilities by interfering with or fully prohibiting access to fundamental features or content. These results often cause users of assistive technologies to abandon essential workflows.
            </td>
          </tr>
          <tr>
            <th scope="row">
              <span className="usa-tag--big usa-tag text-uppercase radius-pill bg-risk-low margin-0 display-inline">Moderate</span>
            </th>
            <td>
              A “Moderate” result likely indicates an issue that presents some frustration and difficulty for people with disabilities. Although such issues may not prohibit users from accessing fundamental features or content, these results often cause users of assistive technologies to abandon non-critical workflows.
            </td>
          </tr>
          <tr>
            <th scope="row">
              <span className="usa-tag--big usa-tag text-uppercase radius-pill bg-risk-info margin-0 display-inline">Minor</span>
            </th>
            <td>
              A “Minor” result indicates a nuisance that introduces minor difficulty for people with disabilities. These issues often produce a frustrating yet mostly functional experience for users.
            </td>
          </tr>
        </tbody>
      </table>

      <p>
        More information about the mechanism powering this report is available in the
        {' '}
        <a
          href="https://github.com/dequelabs/axe-core/blob/develop/doc/"
          target="_blank"
          className="usa-link"
          rel="noreferrer"
        >
          axe-core documentation
        </a>
        .
      </p>
      <hr />
    </>
  );
};

About.propTypes = {
  scanType: PropTypes.string.isRequired,
  siteId: PropTypes.number.isRequired,
  children: PropTypes.node,
};
