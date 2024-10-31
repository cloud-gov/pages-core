import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import Highlight from 'react-highlight';
import { useLocation } from 'react-router-dom';
import { plural, getSuccessCriteria, getWCAGRuleURLs } from '@util/reports';
import FindingSuppression from './FindingSuppression';

const ScanFinding = ({
  finding, groupColor, groupLabel, siteId, sbtId, sbtCustomRules, sbtType,
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
  let criteria = [];
  let hasMoreInfo = '';
  let ruleId = '';


  if ((sbtType === 'zap') || (sbtType === 'owasp-zap')) {
    ({
      name: title, solution, description,
    } = finding);
    anchor = `finding-${finding.alertRef}${ignore ? '-suppressed' : ''}`;
    locations = finding.instances || [];
    count = locations.length;
    references = finding.referenceURLs || [];
    hasMoreInfo = finding.otherinfo;
    ruleId = finding.alertRef;
  }
  if (sbtType === 'a11y') {
    title = `${finding.help}.`;
    anchor = `finding-${finding.id}${ignore ? '-suppressed' : ''}`;
    locations = finding.nodes || [];
    count = locations.length;
    description = `${finding.description}.`;
    solution = finding.nodes[0]?.failureSummary || [];
    criteria = getSuccessCriteria(finding);
     
    references = [
      ...getWCAGRuleURLs(finding.id), 
      ...criteria.map(c => c.url), 
      finding.helpUrl
    ];
    ruleId = finding.id;
    references = [
      ...getWCAGRuleURLs(finding.id),
      ...criteria.map((c) => c.url),
      finding.helpUrl,
    ];
  }

  useEffect(() => {
    async function scrollToAnchor() {
      if (ref && hash?.slice(1) === anchor) {
        ref.current.scrollIntoView({
          behavior: 'smooth',
        });
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
        sbtType={sbtType}
        anchor={anchor}
        criteria={criteria.map((c) => c.short)}
        suppressed={ignore}
      />
      <div className="maxw-tablet-lg">
        <FindingSuppression
          ruleId={ruleId}
          suppressed={ignore}
          suppressedBy={ignoreSource}
          sbtType={sbtType}
          sbtId={sbtId}
          sbtCustomRules={sbtCustomRules}
          siteId={siteId}
        />
        <FindingDescription
          description={description}
          sbtType={sbtType}
          siteId={siteId}
          moreInfo={hasMoreInfo}
        />
        <FindingRecommendation solution={solution} anchor={anchor} sbtType={sbtType} />
        <FindingLocations anchor={anchor} sbtType={sbtType} locations={locations} />
        <FindingReferences references={references} />
      </div>
      <hr />
    </div>
  );
};

ScanFinding.propTypes = {
  finding: PropTypes.object,
  groupColor: PropTypes.string,
  groupLabel: PropTypes.string,
  siteId: PropTypes.number.isRequired,
  sbtId: PropTypes.number.isRequired,
  sbtType: PropTypes.string.isRequired,
  sbtCustomRules: PropTypes.array,
};

const FindingTitle = ({
  title,
  groupLabel,
  groupColor,
  count,
  criteria = [],
  sbtType,
  anchor,
  children,
  suppressed = false,
}) => (
  <div className="bg-white padding-top-05 sticky">
    <h3 className="font-serif-lg margin-y-105">
      {title}
      <a href={`#${anchor}`} className="usa-link target-highlight anchor-indicator">
        #
      </a>
    </h3>
    <p
      className={`
        font-body-md
        padding-bottom-2
        border-bottom-2px
        line-height-sans-5
        break-balance
      `}
    >
      <b>{suppressed ? 'Suppressed ' : '' }</b>
      <span
        className={`
          usa-tag
          bg-${groupColor}
          radius-pill
        `}
      >
        {groupLabel}
      </span>
      finding{' '}
      {sbtType === 'a11y' && criteria.length > 0 && (
        <>
          that violates&nbsp;
          <b>{new Intl.ListFormat('en-US').format(criteria)}</b>
        </>
      )}{' '}
      was identified in{' '}
      <b>
        {count} {plural(count, 'place')}
      </b>
      {'. '}
      {children}
    </p>
  </div>
);

FindingTitle.propTypes = {
  title: PropTypes.string.isRequired,
  groupLabel: PropTypes.string.isRequired,
  groupColor: PropTypes.string.isRequired,
  count: PropTypes.number,
  criteria: PropTypes.array,
  sbtType: PropTypes.string.isRequired,
  anchor: PropTypes.string.isRequired,
  children: PropTypes.node,
  suppressed: PropTypes.bool,
};

const FindingDescription = ({
  description,
  sbtType,
  moreInfo = null,
}) => (
  <div className="margin-y-3">
    {sbtType === 'owasp-zap' && (
      <div
        className="usa-prose finding-description font-serif-sm margin-bottom-2"
        dangerouslySetInnerHTML={{
          __html: description,
        }}
      />
    )}
    {moreInfo && (
      <FindingLocationMoreInfo>
        <code
          dangerouslySetInnerHTML={{
            __html: moreInfo,
          }}
        />
      </FindingLocationMoreInfo>
    )}
    {sbtType !== 'owasp-zap' && (
      <div className="usa-prose finding-description font-serif-sm">
        <p>{description}</p>
      </div>
    )}
  </div>
);

FindingDescription.propTypes = {
  description: PropTypes.string.isRequired,
  sbtType: PropTypes.string.isRequired,
  moreInfo: PropTypes.string,
};

const FindingRecommendation = ({ anchor, solution, sbtType }) => (
  <div id={`${anchor}-recommendation`} aria-labelledby={`${anchor}-recommendation`}>
    <div className="usa-summary-box margin-bottom-3" role="region">
      {sbtType === 'owasp-zap' && (
        <>
          <h4 className="usa-summary-box__heading">
            Recommendation(s):
            <a
              href={`#${anchor}-recommendation`}
              className="usa-link target-highlight anchor-indicator"
            >
              #
            </a>
          </h4>
          <div className="usa-summary-box__body margin-bottom-neg-2">
            <div
              dangerouslySetInnerHTML={{
                __html: solution,
              }}
            />
          </div>
        </>
      )}
      {sbtType === 'a11y' && (
        <>
          {solution.split('\n\n').map((fixList, listindex) => (
            <div key={`${anchor}-location-${listindex}`}>
              {fixList.split('\n').map((str, i) =>
                i === 0 ? (
                  <h4 key={i} className="usa-summary-box__heading">
                    {str}
                    <a
                      href={`#${anchor}-recommendation`}
                      className="usa-link target-highlight anchor-indicator"
                    >
                      #
                    </a>
                  </h4>
                ) : (
                  <div key={i} className="usa-summary-box__body">
                    <ul className="usa-list margin-bottom-2">
                      <li className="font-body-md">{str}</li>
                    </ul>
                  </div>
                ),
              )}
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
  sbtType: PropTypes.string.isRequired,
};

const FindingReferences = ({ references = [] }) => {
  if (references && references.length > 0) {
    return (
      <div className="usa-prose font-serif-xs line-height-serif-6 margin-y-3">
        <h4 className="margin-bottom-05">References</h4>
        <ul className="margin-top-05">
          {references.map((ref) => (
            <FindingReference url={ref} key={ref} />
          ))}
        </ul>
      </div>
    );
  }
  return null;
};

FindingReferences.propTypes = {
  references: PropTypes.array,
};

const FindingReference = ({ url }) => (
  <li className="font-body-2xs">
    <a target="_blank" rel="noreferrer" className="usa-link" href={url}>
      {url}
    </a>
  </li>
);

FindingReference.propTypes = {
  url: PropTypes.string.isRequired,
};

const FindingLocations = ({ locations = [], anchor, sbtType }) => (
  <>
    <h3 className="font-body-md margin-y-2">Evidence for this result was found:</h3>
    <div className="">
      <ol className="padding-left-3">
        {locations.map((location, locationIndex) => {
          const { uri: url } = location;
          const code = sbtType === 'owasp-zap' ? location.evidence : location.html;
          const target = sbtType === 'owasp-zap' ? location.param : location.target;
          const moreInfo = sbtType === 'owasp-zap' ? location.otherinfo : null;
          const locationAnchor = `${anchor}-location-${locationIndex + 1}`;
          return (
            <li
              key={locationAnchor}
              className="margin-bottom-5 margin-left-2 font-mono-md"
            >
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
              {moreInfo && <FindingLocationMoreInfo info={moreInfo} />}
            </li>
          );
        })}
      </ol>
    </div>
  </>
);

FindingLocations.propTypes = {
  locations: PropTypes.array.isRequired,
  anchor: PropTypes.string.isRequired,
  sbtType: PropTypes.string.isRequired,
};

const FindingLocationURL = ({ url }) => (
  <>
    On{' '}
    <a href={url} className="usa-link" target="_blank" rel="noopener noreferrer">
      {url}
      <svg
        className="usa-icon"
        xmlns="http://www.w3.org/2000/svg"
        height="24"
        viewBox="0 0 24 24"
        width="24"
      >
        <path
          fill="currentColor"
          // eslint-disable-next-line max-len
          d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"
        />
      </svg>
    </a>
  </>
);

FindingLocationURL.propTypes = {
  url: PropTypes.string.isRequired,
};

const FindingLocationTarget = ({ target }) => (
  <>
    <h5 className="margin-bottom-2 margin-top-0 font-body-sm text-normal">
      Related to this element:
    </h5>
    <code
      className={`
        css
        text-normal
        narrow-mono
        font-mono-sm
        line-height-mono-4
        bg-accent-warm-lighter
        padding-05
        break-anywhere
      `}
    >
      {target}
    </code>
  </>
);

FindingLocationTarget.propTypes = {
  target: PropTypes.string.isRequired,
};

const FindingLocationEvidence = ({ code }) => (
  <>
    <h5 className="margin-bottom-0 margin-top-3 font-body-sm text-normal">
      Within this code:
    </h5>
    <Highlight
      className={`
        html
        text-wrap
        width-full
        font-mono-xs
        line-height-mono-4
        narrow-mono
        padding-2
        display-inline-block
      `}
    >
      {code}
    </Highlight>
  </>
);

FindingLocationEvidence.propTypes = {
  code: PropTypes.string.isRequired,
};

const FindingLocationMoreInfo = ({ info = null, children = null }) => (
  <details>
    <summary className="margin-bottom-0 margin-top-1 font-body-sm text-normal">
      <b>More information:</b>
    </summary>
    <pre
      className={`
        hljs
        html
        text-wrap
        width-full
        font-mono-xs
        line-height-mono-4
        narrow-mono
        padding-2
        display-inline-block
      `}
    >
      {info}
      {children}
    </pre>
  </details>
);

FindingLocationMoreInfo.propTypes = {
  info: PropTypes.string,
  children: PropTypes.node,
};

export default ScanFinding;
