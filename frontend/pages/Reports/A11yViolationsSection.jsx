import React from 'react';
import * as utils from './utils'

const A11yViolationsSection = ({ violationsCount, groupedViolations }) => (
  <div className="desktop:grid-col desktop:margin-left-4 ">
    <h2 className="font-heading-xl margin-bottom-1 margin-top-3">
      All accessibility violations <span className="font-body-xl text-secondary-vivid">({violationsCount})</span>
    </h2>
    {violationsCount > 0 && groupedViolations ? Object.keys(groupedViolations).map(group => (
      groupedViolations[group].length > 0 && (
        <div key={group}>
          <a id={`${group}-violations`}></a>
          <div className="margin-y-2 padding-bottom-2">
            {groupedViolations[group].map((check, index) => (
              <div key={index} id={`${group}-violation-${index + 1}`}>
                <div className="bg-white padding-top-05 sticky">
                  <h3 className="font-heading-lg margin-y-105">
                    {check.help}. <span className={`usa-tag bg-${check.color} radius-pill text-middle`}>{check.impact}</span>
                  </h3>
                  <p className="font-body-md padding-bottom-2 border-bottom-1px">
                    {check.description} in <b>{check.nodes.length} {utils.plural(check.nodes.length, 'location')}</b>.
                    <a href={check.helpUrl} target="_blank" className="usa-link font-body-sm" aria-label="Learn more about this rule">Learn more
                      <svg className="usa-icon" xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24">
                        <path fill="currentColor" d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z" />
                      </svg>
                    </a>
                  </p>
                </div>
                <ol className="margin-top-4">
                  {check.nodes.map((node, nodeindex) => (
                    <li key={nodeindex} className="margin-bottom-4 margin-left-2 font-mono-lg">
                      <a id={`${group}-violation-${index + 1}-element-${nodeindex + 1}`}></a>
                      <h4 className="font-body-lg margin-bottom-0">
                        Related element:
                        <code className="css text-normal narrow-mono font-mono-md line-height-mono-4 bg-accent-warm-lighter padding-05 break-anywhere">{node.target}</code>
                      </h4>
                      <h5 className="margin-bottom-0 font-body-sm text-semibold">Location in page:</h5>
                      <pre><code className="html text-wrap font-mono-xs line-height-mono-4 narrow-mono">{node.html}</code></pre>
                      {node.failureSummary && (
                        <div className="usa-summary-box margin-top-3" role="region" aria-labelledby={`${group}-violation-${index + 1}-element-${nodeindex + 1}-fix-0`}>
                          <div className="usa-summary-box__body">
                            {node.failureSummary.split('\n\n').map((fixList, listindex) => (
                              <div key={listindex}>
                                {fixList.split('\n').map((str, i) => (
                                  i === 0 ? (
                                    <h4 key={i} className="usa-summary-box__heading" id={`${group}-violation-${index + 1}-element-${nodeindex + 1}-fix-${listindex}`}>
                                      {str}
                                    </h4>
                                  ) : (
                                    <ul key={i} className="usa-list margin-bottom-2">
                                      <li>{str}</li>
                                    </ul>
                                  )
                                ))}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        </div>
      )
    )) : (
      <section className="usa-alert usa-alert--success maxw-tablet margin-y-3">
        <div className="usa-alert__body">
          <p className="usa-alert__text">No WCAG violations found.</p>
        </div>
      </section>
    )}
    <hr />
  </div>
);

export default A11yViolationsSection;

