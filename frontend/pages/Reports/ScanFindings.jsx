
import React from 'react';
import ScanFinding from './ScanResult.jsx';
import * as utils from './utils.js';

const ScanFindings = ({ count, groupedFindings, scanType = 'zap' }) => {
  return (
    <>
      {(count && groupedFindings) ? (
        utils.severity[scanType].map(({ riskCode: group, name, label, color }, groupIndex) => (
          <React.Fragment key={group}>
            <a className="margin-1px" id={`${name}-findings`}></a>
            {groupedFindings[group] && groupedFindings[group].length > 0 && (
              <>
              <h2 className="font-heading-xl margin-bottom-1 margin-top-0">
                {label} findings <span className="font-body-xl text-secondary-vivid">({groupedFindings[group].length})</span>
              </h2>

                <div className="margin-y-2">
                  {groupedFindings[group].map((finding, findingIndex) => (
                    <ScanFinding
                      key={findingIndex}
                      finding={finding}
                      groupColor={color}
                      groupLabel={label}
                    />
                  ))}
                </div>
              </>
            )}
          </React.Fragment>
        ))
      ) : (
        <></>
      )}
    </>
  );
};

export default ScanFindings;
