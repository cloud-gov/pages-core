import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import Highlight from 'react-highlight';
import { Link, useLocation } from 'react-router-dom';

import { plural } from '../../util/reports';

const ScanFinding = ({
  finding, groupColor, groupLabel, scanType = 'zap', siteId,
}) => {
  const ref = useRef(null);
  const { hash } = useLocation();
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
      name: title, solution, description,
    } = finding);
    anchor = `finding-${finding.alertRef}`;
    count = parseInt(finding.count, 10);
    locations = finding.instances || [];
    references = finding.referenceURLs || [];
    if (finding.otherinfo) {
      description += `\n ${finding.otherinfo}`;
    }
  }
  if (scanType === 'a11y') {
    title = `${finding.help}.`;
    anchor = `finding-${finding.id}`;
    count = finding.nodes.length;
    description = `${finding.description}.`;
    locations = finding.nodes || [];
    solution = finding.nodes[0]?.failureSummary || [];
    references = [finding.helpUrl];
  }

  useEffect(() => {
    async function scrollToAnchor() {
      if (ref && hash?.slice(1) === anchor) {
        ref.current.scrollIntoView({ behavior: 'smooth' });
      }
    }

    scrollToAnchor();
  }, [ref, hash, anchor]);

  return (
    <div ref={ref} id={anchor} className="margin-bottom-5">
      <FindingTitle
        title={title}
        groupLabel={groupLabel}
        groupColor={groupColor}
        count={count}
        references={references}
        scanType={scanType}
        anchor={anchor}
      />
      <div className="maxw-tablet-lg">
        <FindingDescription
          description={description}
          scanType={scanType}
          ignore={ignore}
          ignoreSource={ignoreSource}
          siteId={siteId}
        />
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
  siteId: PropTypes.number.isRequired,
  scanType: PropTypes.string,
};

const FindingTitle = ({
  title,
  groupLabel,
  groupColor,
  count,
  references = [],
  scanType,
  anchor,
}) => (
  <div className="bg-white padding-top-05 sticky">
    <h3 className="font-heading-lg margin-y-105">
      {title}
      <a href={`#${anchor}`} className="usa-link target-highlight anchor-indicator">#</a>
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
        {plural(count, 'place')}
      </b>
      {'. '}
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
  scanType: PropTypes.string.isRequired,
  anchor: PropTypes.string.isRequired,

};

const FindingDescription = ({
  description,
  scanType,
  siteId,
  ignore = false,
  ignoreSource = null,
}) => (
  <div className="margin-y-3">
    {ignore && (
      <div className="usa-prose font-serif-xs">
        <p className="text-italic">
          {`(Note: This finding has been suppressed by ${ignoreSource || 'an existing report configuration'}. You can review the report rules and criteria that are suppressed during report generation in your `}
          <Link reloadDocument to={`/sites/${siteId}/settings`} className="usa-link">Site Settings Report Configuration</Link>
          {'.) '}
        </p>
      </div>
    )}
    { scanType === 'zap' && (
      // eslint-disable-next-line react/no-danger
      <div className="usa-prose font-serif-xs" dangerouslySetInnerHTML={{ __html: description }} />
    )}
    { scanType !== 'zap' && <div className="usa-prose font-serif-xs"><p>{description}</p></div> }
  </div>
);

FindingDescription.propTypes = {
  description: PropTypes.string.isRequired,
  scanType: PropTypes.string.isRequired,
  ignore: PropTypes.bool,
  ignoreSource: PropTypes.string,
  siteId: PropTypes.number.isRequired,
};

const FindingRecommendation = ({ anchor, solution, scanType }) => (
  <div
    id={`${anchor}-recommendation`}
    className="padding-top-15"
    aria-labelledby={`${anchor}-recommendation`}
  >
    <div className="usa-summary-box margin-bottom-6 margin-top-neg-3" role="region">
      { (scanType === 'zap') && (
      <>
        <h4 className="usa-summary-box__heading">
          Recommendation(s):
          <a href={`#${anchor}-recommendation`} className="usa-link target-highlight anchor-indicator">#</a>
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
          <div key={`${anchor}-location-${listindex}`}>
            {fixList.split('\n').map((str, i) => (
              i === 0 ? (
                // eslint-disable-next-line react/no-array-index-key
                <h4 key={i} className="usa-summary-box__heading">
                  {str}
                  <a href={`#${anchor}-recommendation`} className="usa-link target-highlight anchor-indicator">#</a>
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
  </div>
);

FindingRecommendation.propTypes = {
  anchor: PropTypes.string.isRequired,
  solution: PropTypes.string.isRequired,
  scanType: PropTypes.string.isRequired,
};

const FindingReferences = ({ references = [] }) => {
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

const FindingLocations = ({ locations = [], anchor, scanType }) => (
  <>
    <h3 className="font-body-md margin-y-2">
      Evidence for this result was found:
    </h3>
    <div className="margin-bottom-neg-10">
      <ol className="padding-left-3">
        {locations.map((location, locationIndex) => {
          const { uri: url } = location;
          const code = scanType === 'zap' ? location.evidence : location.html;
          const target = scanType === 'zap' ? location.param : location.target;
          const moreInfo = scanType === 'zap' ? location.otherinfo : null;
          const locationAnchor = `${anchor}-location-${locationIndex + 1}`;
          return (
            <li key={locationAnchor} className="margin-bottom-5 margin-left-2 font-mono-md">
              {/* TODO: Review this one */}
              {/* eslint-disable-next-line jsx-a11y/anchor-has-content */}
              <a id={locationAnchor} href={`#${locationAnchor}`} label="anchor" />
              {url && (
              <h4 className="font-body-md text-normal margin-bottom-0">
                <FindingLocationURL url={url} />
              </h4>
              )}
              {code && <FindingLocationEvidence code={code} />}
              {target && <FindingLocationTarget target={target} />}
              {moreInfo && (
                <>
                  <h4 className="font-body-md text-normal margin-bottom-0">
                    Additional information:
                  </h4>
                  <p className="font-body-sm padding-bottom-4 border-bottom-1px">
                    {moreInfo}
                  </p>
                </>
              )}
            </li>
          );
        })}
      </ol>
    </div>
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
    <h5 className="margin-bottom-2 margin-top-0 font-body-sm text-normal">Related to this element:</h5>
    <code className="css text-normal narrow-mono font-mono-sm line-height-mono-4 bg-accent-warm-lighter padding-05 break-anywhere">
      {target}
    </code>
  </>
);

FindingLocationTarget.propTypes = {
  target: PropTypes.string.isRequired,
};

const FindingLocationEvidence = ({ code }) => (
  <>
    <h5 className="margin-bottom-0 margin-top-3 font-body-sm text-normal">Within this code:</h5>
    <Highlight className="html text-wrap width-full font-mono-xs line-height-mono-4 narrow-mono padding-2 display-inline-block">
      {code}
    </Highlight>
  </>
);

FindingLocationEvidence.propTypes = {
  code: PropTypes.string.isRequired,
};

export default ScanFinding;
