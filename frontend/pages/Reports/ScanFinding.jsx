import React from 'react';
import Highlight from 'react-highlight';
import * as utils from './utils.js';

const ScanFinding = ({
  finding, groupColor, groupLabel, scanType = 'zap', index,
}) => {
  const defaultProps = {
    scanType,
    groupLabel,
    groupColor,
    ignore: finding.ignore,
    ignoreSource: finding.ignoreSource,
    title: '',
    count: 0,
    anchor: '',
    description: '',
    descriptionHTML: '',
    solution: '',
    references: [],
    locations: [],
  };
  let scanProps = { ...defaultProps };

  if (scanType === 'zap') {
    scanProps = {
      ...scanProps,
      title: finding.name,
      anchor: `finding-${finding.alertRef}`,
      count: finding.count,
      descriptionHTML: finding.description,
      solution: finding.solution,
      locations: finding.instances || [],
      references: finding.referenceURLs || [],
    };
  }
  if (scanType === 'a11y') {
    scanProps = {
      ...scanProps,
      title: `${finding.help}.`,
      anchor: `finding-${groupLabel}-${index}`,
      count: finding.nodes.length,
      description: `${finding.description}.`,
      locations: finding.nodes || [],
      solution: finding.nodes[0]?.failureSummary || [],
      references: [finding.helpUrl],
    };
  }
  const findingTitleProps = (({
    title,
    groupLabel,
    groupColor,
    count,
    ignore,
    ignoreSource,
    references,
    scanType,
  }) => ({
    title,
    groupLabel,
    groupColor,
    count,
    ignore,
    ignoreSource,
    references,
    scanType,
  }))(scanProps);

  const findingDescProps = (({
    description,
    descriptionHTML,
  }) => ({
    description,
    descriptionHTML,
  }))(scanProps);

  const findingRecProps = (({
    solution,
    anchor,
    scanType,
  }) => ({
    solution,
    anchor,
    scanType,
  }))(scanProps);

  const findingRefProps = (({
    references: [...references],
  }) => ({
    references: [...references],
  }))(scanProps);

  const findingLocationProps = (({
    anchor,
    scanType,
    locations: [...locations],
  }) => ({
    anchor,
    scanType,
    locations: [...locations],
  }))(scanProps);

  return (
    <div id={scanProps.anchor} className="margin-bottom-5">
      <FindingTitle {...findingTitleProps} />
      <div className="maxw-tablet-lg">
        <FindingDescription {...findingDescProps} />
        <FindingLocations {...findingLocationProps} />
        <FindingRecommendation {...findingRecProps} />
        <FindingReferences {...findingRefProps} />
      </div>
      <hr />
    </div>
  );
};

const FindingTitle = ({
  title, groupLabel, groupColor, count, references = [], ignore = false, ignoreSource = null, scanType = 'zap',
}) => (
  <div className="bg-white padding-top-05 sticky">
    <h3 className="font-heading-lg margin-y-105">
      {title}
    </h3>
    <p className="font-body-md padding-bottom-2 border-bottom-2px line-height-body-2">
      <span className={`usa-tag bg-${groupColor} radius-pill`}>
        {groupLabel}
      </span>
      {' '}
      finding identified in
      {' '}
      <b>
        {count}
        {' '}
        {utils.plural(count, 'location')}
      </b>
      {'. '}
      {ignore && (
      <i className="text-no-wrap">
        {' (Note: This finding has been suppressed by '}
        {ignoreSource}
        {'.) '}
      </i>
      )}
      {scanType == 'a11y' && references.length > 0 && (
      <a href={references[0]} target="_blank" className="usa-link font-body-sm" aria-label="Learn more about this rule" rel="noreferrer">
        Learn more
        {' '}
        <svg className="usa-icon" xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24">
          <path fill="currentColor" d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z" />
        </svg>
      </a>
      )}
    </p>
  </div>
);
// could be a slot
const FindingDescription = ({ description, descriptionHTML }) => (
  <>
    {descriptionHTML ? (
      <div className="usa-prose font-serif-xs line-height-serif-6 margin-y-3" dangerouslySetInnerHTML={{ __html: descriptionHTML }} />
    ) : (
      <div className="usa-prose font-serif-xs line-height-serif-6 margin-y-3">{description}</div>
    )}
  </>
);
const FindingRecommendation = ({ anchor, solution, scanType = 'zap' }) => (
  <div
    className="usa-summary-box margin-y-4"
    role="region"
    aria-labelledby={`${anchor}-solution`}
  >
    { (scanType === 'zap') && (
    <>
      <h4 className="usa-summary-box__heading" id={`${anchor}-solution`}>
        Recommendation(s):
      </h4>
      <div className="usa-summary-box__body margin-bottom-neg-2">
        <div dangerouslySetInnerHTML={{ __html: solution }} />
      </div>
    </>
    )}
    { (scanType === 'a11y') && (
    <>
      {solution.split('\n\n').map((fixList, listindex) => (
        <div key={listindex}>
          {fixList.split('\n').map((str, i) => (
            i === 0 ? (
                    // <a id={`${group}-violation-${index + 1}-element-${nodeindex + 1}-fix-${listindex}`}>
              <h4 key={i} className="usa-summary-box__heading" id={`${anchor}-solution`}>
                      {str}
                    </h4>
            ) : (
              <div className="usa-summary-box__body">
                      <ul key={i} className="usa-list margin-bottom-2">
                        <li>{str}</li>
                      </ul>
                    </div>
            )
          ))}
        </div>
      ))}
    </>
    )}
  </div>
);

const FindingReferences = ({ references }) => (
  <>
    {references && references.length > 0 && (
    <div className="usa-prose font-serif-xs line-height-serif-6 margin-y-3">
      <h4 className="margin-bottom-05">References</h4>
      <ul className="margin-top-05">
        {references.map((ref, index) => (
          <FindingReference url={ref} key={index} />
        ))}
      </ul>
    </div>
    )}
  </>
);
const FindingReference = ({ url, text = url }) => (
  <li className="font-body-2xs">
    <a className="usa-link" href={url}>{text}</a>
  </li>
);
const FindingLocations = ({ locations, anchor, scanType = 'zap' }) => (
  <>
    <h3 className="font-body-md margin-y-2">
      Evidence for this finding was identified:
    </h3>
    <ol>
      {locations.map((location, locationIndex) => {
        let localProps = {
          anchor,
          url: null,
          evidence: null,
          target: null,
          otherInfo: null,
          index: locationIndex,
        };

        if (scanType === 'zap') {
          localProps = {
            ...localProps,
            anchor,
            url: location.uri,
            evidence: location.evidence,
            target: location.param,
            otherInfo: location.otherInfo,
            index: locationIndex,
          };
        }
        if (scanType === 'a11y') {
          localProps = {
            ...localProps,
            anchor,
            // url: location.uri,
            evidence: location.html,
            target: location.target,
            // otherInfo: location.otherInfo,
            index: locationIndex,
          };
        }

        return (
          <li className="margin-bottom-5 margin-left-2 font-mono-md">
            <a id={`${localProps.anchor}-location-${locationIndex + 1}`} />
            {localProps.url && (
            <h4 className="font-body-md text-normal margin-bottom-0">
              <FindingLocationURL url={localProps.url} />
            </h4>
            )}
            {localProps.target && (
            <FindingLocationTarget target={localProps.target} />
            )}
            {localProps.evidence && <FindingLocationEvidence evidence={localProps.evidence} />}
            {localProps.otherInfo && (
            <p className="font-body-sm padding-bottom-2 border-bottom-1px">
              Additional info:
              {' '}
              {localProps.otherInfo}
            </p>
            )}
          </li>
        );
      })}
    </ol>
  </>
);

const FindingLocationURL = ({ url, text = url }) => (
  <>
    On
    {' '}
    <a href={url} className="usa-link" target="_blank" rel="noopener noreferrer">
      {text}
      <svg className="usa-icon" xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24">
        <path fill="currentColor" d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z" />
      </svg>
    </a>
  </>
);

const FindingLocationTarget = ({ target }) => (
  <>
    <h5 className="margin-bottom-2 font-body-sm text-normal">For this target:</h5>
    <code className="css text-normal narrow-mono font-mono-sm line-height-mono-4 bg-accent-warm-lighter padding-05 break-anywhere">
      {target}
    </code>
  </>
);

const FindingLocationEvidence = ({ evidence }) => (
  <>
    <h5 className="margin-bottom-0 margin-top-2 font-body-sm text-normal">Within this fragment:</h5>
    <Highlight className="html text-wrap width-full font-mono-xs line-height-mono-4 narrow-mono padding-2 display-inline-block">
      {evidence}
    </Highlight>
  </>
);

export default ScanFinding;
