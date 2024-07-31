
import React from 'react';
import * as utils from './utils.js';

const ScanFinding = ({ riskCode, alert, color }) => {
  return (
    <div id={`alert-${alert.alertRef}`}>
      <div className="bg-white padding-top-05 sticky">
        <h3 className="font-heading-lg margin-y-105">
          {alert.name}
          <span className={`usa-tag bg-${color} radius-pill text-middle`}>
            {alert.riskLabel}
          </span>
        </h3>
        <p className="font-body-md padding-bottom-2 border-bottom-1px">
          Identified in <b>{alert.count} {utils.plural(alert.count, 'location')}</b>.
        </p>
      </div>
      <div className="usa-prose font-serif-xs line-height-serif-6 margin-y-3">
        <div dangerouslySetInnerHTML={{ __html: alert.description }} />

        {alert.referenceURLs && alert.referenceURLs.length > 0 && (
          <div>
            <h4>References</h4>
            <ul>
              {alert.referenceURLs.map((url, index) => (
                <li className="font-body-2xs" key={index}>
                  <a className="usa-link" href={url}>{url}</a>
                </li>
              ))}
            </ul>
          </div>
        )}
        <div
          className="usa-summary-box maxw-tablet margin-y-4"
          role="region"
          aria-labelledby={`alert-${alert.alertRef}-solution`}
        >
          <h4 className="usa-summary-box__heading" id={`alert-${alert.alertRef}-solution`}>
            Recommendation(s)
          </h4>
          <div className="usa-summary-box__body margin-bottom-neg-2">
            <div dangerouslySetInnerHTML={{ __html: alert.solution }} />
          </div>
        </div>
        <FindingLocations alert={alert} />
      </div>
    </div>
  );
};

const FindingLocations = ({ alert }) => {
  return (
    <>
      <h3 className="font-body-lg margin-y-2">Location(s) to investigate:</h3>
      <ol className="margin-top-4">
        {alert.instances.map((instance, instanceIndex) => (
          <li className="margin-bottom-4 margin-left-2 font-mono-md" key={instanceIndex}>
            <a id={`alert-${alert.alertRef}-instance-${instanceIndex + 1}`} />
            <h4 className="font-body-md margin-bottom-0">
              {instance.uri ? (
                <>
                  On <a href={instance.uri} className="usa-link" target="_blank" rel="noopener noreferrer">
                    {instance.uri}
                    <svg className="usa-icon" xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24">
                      <path fill="currentColor" d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z" />
                    </svg>
                  </a>
                </>
              ) : 'Finding'}
            </h4>
            {instance.param && (
              <>
                <h5 className="margin-bottom-0 font-body-sm">Parameter:</h5>
                <p>
                  <code className="css text-normal narrow-mono font-mono-xs line-height-mono-4 bg-accent-warm-lighter padding-05 break-anywhere">
                    {instance.param}
                  </code>
                </p>
              </>
            )}
            {instance.evidence && (
              <>
                <h5 className="margin-bottom-0 font-body-sm">Location:</h5>
                <pre>
                  <code className="html text-wrap maxw-tablet font-mono-xs line-height-mono-4 narrow-mono">
                    {instance.evidence}
                  </code>
                </pre>
              </>
            )}
            {instance.otherInfo && (
              <p className="font-body-sm padding-bottom-2 border-bottom-1px">
                Additional info: {instance.otherInfo}
              </p>
            )}
          </li>
        ))}
      </ol>
    </>
  );
};
export default ScanFinding;
