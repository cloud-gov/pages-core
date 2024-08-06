import React from 'react';
import PropTypes from 'prop-types';
import ScanFinding from './ScanFinding';
import { severity } from './utils';

const ScanFindings = ({ count, groupedFindings, scanType }) => {
  const groupKey = scanType === 'zap' ? 'riskCode' : 'name';
  if (count && groupedFindings) {
    return (
      <>
        {(
          severity[scanType].map(({ [groupKey]: group, label, color }, groupIndex) => (
            <React.Fragment key={group}>
              {groupedFindings[group] && groupedFindings[group].length > 0 && (
                <>
                  <h2 className="font-heading-xl margin-bottom-1 margin-top-4" id={`${label}-findings`}>
                    {label}
                    {' '}
                    findings
                    <span className="font-body-xl text-secondary-vivid">
                      (
                      {groupedFindings[group].length}
                      )
                    </span>
                  </h2>
                  <div className="margin-y-2">
                    {groupedFindings[group].map((finding, findingIndex) => (
                      <ScanFinding
                        key={finding.name || finding.help}
                        index={findingIndex}
                        finding={finding}
                        groupColor={color}
                        groupLabel={label}
                        groupIndex={groupIndex}
                        scanType={scanType}
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
  // eslint-disable-next-line react/forbid-prop-types
  groupedFindings: PropTypes.array.isRequired,
  scanType: PropTypes.string.isRequired,
};

export default ScanFindings;
