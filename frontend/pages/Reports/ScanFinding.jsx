import React from 'react';
import PropTypes from 'prop-types';
import Highlight from 'react-highlight';

import { plural } from './utils';

const ScanFinding = ({
  finding, groupColor, groupLabel, scanType = 'zap', index,
}) => {
  const { ignore, ignoreSource } = finding;
  let title = '';
  let count = 0;
  let anchor = '';
  let description = '';
  let solution = '';
  let references = [];
  let locations = [];

  if (scanType === 'zap') {
    ({
      name: title, count, solution, descriptionHTML: description,
    } = finding);
    anchor = `finding-${finding.alertRef}`;
    locations = finding.instances || [];
    references = finding.referenceURLs || [];
  }
  if (scanType === 'a11y') {
    title = `${finding.help}.`;
    anchor = `finding-${groupLabel}-${index}`;
    count = finding.nodes.length;
    description = `${finding.description}.`;
    locations = finding.nodes || [];
    solution = finding.nodes[0]?.failureSummary || [];
    references = [finding.helpUrl];
  }

  return (
    <div id={anchor} className="margin-bottom-5">
      <FindingTitle
        title={title}
        groupLabel={groupLabel}
        groupColor={groupColor}
        count={count}
        ignore={ignore}
        ignoreSource={ignoreSource}
        references={references}
        scanType={scanType}
      />
      <div className="maxw-tablet-lg">
        <FindingDescription description={description} scanType={scanType} />
        <FindingLocations anchor={anchor} scanType={scanType} locations={locations} />
        <FindingRecommendation solution={solution} anchor={anchor} scanType={scanType} />
        <FindingReferences references={references} />
      </div>
      <hr />
    </div>
  );
};

ScanFinding.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  finding: PropTypes.object,
  groupColor: PropTypes.string,
  groupLabel: PropTypes.string,
  scanType: PropTypes.string,
  index: PropTypes.number,
};

const FindingTitle = ({
  title,
  groupLabel,
  groupColor,
  count,
  references = [],
  ignore = false,
  ignoreSource = null,
  scanType,
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
        {plural(count, 'location')}
      </b>
      {'. '}
      {ignore && (
      <i className="text-no-wrap">
        {' (Note: This finding has been suppressed by '}
        {ignoreSource}
        {'.) '}
      </i>
      )}
      {scanType === 'a11y' && references.length > 0 && (
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

FindingTitle.propTypes = {
  title: PropTypes.string.isRequired,
  groupLabel: PropTypes.string.isRequired,
  groupColor: PropTypes.string.isRequired,
  count: PropTypes.number,
  // eslint-disable-next-line react/forbid-prop-types
  references: PropTypes.array,
  ignore: PropTypes.bool,
  ignoreSource: PropTypes.string,
  scanType: PropTypes.string.isRequired,
};

// could be a slot
const FindingDescription = ({ description, scanType }) => {
  if (scanType === 'zap') {
    // eslint-disable-next-line react/no-danger
    <div className="usa-prose font-serif-xs line-height-serif-6 margin-y-3" dangerouslySetInnerHTML={{ __html: description }} />;
  }
  return <div className="usa-prose font-serif-xs line-height-serif-6 margin-y-3">{description}</div>;
};

FindingDescription.propTypes = {
  description: PropTypes.string.isRequired,
  scanType: PropTypes.string.isRequired,
};

const FindingRecommendation = ({ anchor, solution, scanType }) => (
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
        { /* eslint-disable-next-line react/no-danger */ }
        <div dangerouslySetInnerHTML={{ __html: solution }} />
      </div>
    </>
    )}
    { (scanType === 'a11y') && (
    <>
      {solution.split('\n\n').map((fixList, listindex) => (
        // eslint-disable-next-line react/no-array-index-key
        <div key={listindex}>
          {fixList.split('\n').map((str, i) => (
            i === 0 ? (
            // <a id={`${group}-violation-${index + 1}-element-${nodeindex + 1}-fix-${listindex}`}>
              // eslint-disable-next-line react/no-array-index-key
              <h4 key={i} className="usa-summary-box__heading" id={`${anchor}-solution`}>
                {str}
              </h4>
            ) : (
              <div className="usa-summary-box__body">
                { /* eslint-disable-next-line react/no-array-index-key */ }
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

FindingRecommendation.propTypes = {
  anchor: PropTypes.string.isRequired,
  solution: PropTypes.string.isRequired,
  scanType: PropTypes.string.isRequired,
};

const FindingReferences = ({ references }) => {
  if (references && references.length > 0) {
    return (
      <div className="usa-prose font-serif-xs line-height-serif-6 margin-y-3">
        <h4 className="margin-bottom-05">References</h4>
        <ul className="margin-top-05">
          {references.map(ref => (
            <FindingReference url={ref} key={ref} />
          ))}
        </ul>
      </div>
    );
  }
  return null;
};

FindingReferences.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  references: PropTypes.array,
};

const FindingReference = ({ url }) => (
  <li className="font-body-2xs">
    <a className="usa-link" href={url}>{url}</a>
  </li>
);

FindingReference.propTypes = { url: PropTypes.string.isRequired };

const FindingLocations = ({ locations, anchor, scanType }) => (
  <>
    <h3 className="font-body-md margin-y-2">
      Evidence for this finding was identified:
    </h3>
    <ol>
      {locations.map((location, locationIndex) => {
        const { uri: url, otherInfo } = location;
        const evidence = scanType === 'zap' ? location.evidence : location.html;
        const target = scanType === 'zap' ? location.param : location.target;
        const locationAnchor = `${anchor}-location-${locationIndex + 1}`;
        return (
          <li className="margin-bottom-5 margin-left-2 font-mono-md">
            {/* TODO: Review this one */}
            {/* eslint-disable-next-line jsx-a11y/anchor-has-content */}
            <a id={locationAnchor} href={`#${locationAnchor}`} label="anchor" />
            {url && (
            <h4 className="font-body-md text-normal margin-bottom-0">
              <FindingLocationURL url={url} />
            </h4>
            )}
            {target && <FindingLocationTarget target={target} />}
            {evidence && <FindingLocationEvidence evidence={evidence} />}
            {otherInfo && (
            <p className="font-body-sm padding-bottom-2 border-bottom-1px">
              Additional info:
              {' '}
              {otherInfo}
            </p>
            )}
          </li>
        );
      })}
    </ol>
  </>
);

FindingLocations.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  locations: PropTypes.array.isRequired,
  anchor: PropTypes.string.isRequired,
  scanType: PropTypes.string.isRequired,
};

const FindingLocationURL = ({ url }) => (
  <>
    On
    {' '}
    <a href={url} className="usa-link" target="_blank" rel="noopener noreferrer">
      {url}
      <svg className="usa-icon" xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24">
        <path fill="currentColor" d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z" />
      </svg>
    </a>
  </>
);

FindingLocationURL.propTypes = {
  url: PropTypes.string.isRequired,
};

const FindingLocationTarget = ({ target }) => (
  <>
    <h5 className="margin-bottom-2 font-body-sm text-normal">For this target:</h5>
    <code className="css text-normal narrow-mono font-mono-sm line-height-mono-4 bg-accent-warm-lighter padding-05 break-anywhere">
      {target}
    </code>
  </>
);

FindingLocationTarget.propTypes = {
  target: PropTypes.string.isRequired,
};

const FindingLocationEvidence = ({ evidence }) => (
  <>
    <h5 className="margin-bottom-0 margin-top-2 font-body-sm text-normal">Within this fragment:</h5>
    <Highlight className="html text-wrap width-full font-mono-xs line-height-mono-4 narrow-mono padding-2 display-inline-block">
      {evidence}
    </Highlight>
  </>
);

FindingLocationEvidence.propTypes = {
  evidence: PropTypes.string.isRequired,
};

export default ScanFinding;
