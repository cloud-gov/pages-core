import React from 'react';
import PropTypes from 'prop-types';
import { severity } from '@util/reports';
import ScanFinding from './ScanFinding';

const ScanFindings = ({
  count,
  groupedFindings,
  siteId,
  sbtId,
  sbtType,
  sbtCustomRules,
}) => {
  const scanGroup = sbtType === 'owasp-zap' ? 'zap' : 'a11y';
  const groupKey = scanGroup === 'zap' ? 'riskCode' : 'name';
  if (count && groupedFindings) {
    return (
      <>
        {(
          severity[scanGroup].map(({ [groupKey]: group, label, color }, groupIndex) => (
            <React.Fragment key={group}>
              {groupedFindings[group] && groupedFindings[group]?.length > 0 && (
                <>
                  <h2 
                    className="font-serif-xl margin-bottom-1 padding-top-2 margin-top-2"
                    id={`${label}-findings`}
                  >
                    {label}
                    {' '}
                    findings
                    <span className="font-body-xl text-secondary-vivid">
                      {' '}
                      (
                      {groupedFindings[group]?.length}
                      )
                    </span>
                  </h2>
                  <div className="margin-y-2">
                    {groupedFindings[group]?.map((finding, findingIndex) => (
                      <ScanFinding
                        key={finding.name || finding.help}
                        index={findingIndex}
                        finding={finding}
                        groupColor={color}
                        groupLabel={label}
                        groupIndex={groupIndex}
                        siteId={siteId}
                        sbtId={sbtId}
                        sbtType={sbtType}
                        sbtCustomRules={sbtCustomRules}
                      />
                    ))}
                  </div>
                </>
              )}
            </React.Fragment>
          ))
        )}
      </>
    );
  }
  return null;
};

ScanFindings.propTypes = {
  count: PropTypes.number.isRequired,
  groupedFindings: PropTypes.object.isRequired,
  siteId: PropTypes.number.isRequired,
  sbtId: PropTypes.number.isRequired,
   
  sbtCustomRules: PropTypes.array,
  sbtType: PropTypes.string.isRequired,
};

export default ScanFindings;
