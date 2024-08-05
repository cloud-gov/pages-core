import React from 'react';
import ScanFinding from './ScanFinding.jsx';
import * as utils from './utils.js';

const ScanFindings = ({ count, groupedFindings, scanType }) => {
  const groupKey = scanType === 'zap' ? 'riskCode' : 'name';
  return (
    <>
      {(count && groupedFindings) && (
        utils.severity[scanType].map(({ [groupKey]: group, label, color }, groupIndex) => (
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
                      key={findingIndex}
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
};

export default ScanFindings;
