
import React from 'react';
import ScanFinding from './ScanResult.jsx';
import * as utils from './utils.js';

const ScanFindings = ({ alerts, groupedAlerts }) => {
  return (
    <>
      {(alerts.length && groupedAlerts) ? (
        utils.severity['zap'].map(({ riskCode, name, color }, groupIndex) => (
          <React.Fragment key={riskCode}>
            <a className="margin-1px" id={`${name}-findings`}></a>
            {groupedAlerts[riskCode] && groupedAlerts[riskCode].length > 0 && (
              <>
              <h2 className="font-heading-xl margin-bottom-1 margin-top-0">
                {name} {riskCode < 1 && ' or unknown'} risk findings <span className="font-body-xl text-secondary-vivid">({groupedAlerts[riskCode].length})</span>
              </h2>

                <div className="margin-y-2">
                  {groupedAlerts[riskCode].map((alert, alertIndex) => (
                    !!alert?.alertRef && (
                        <ScanFinding
                        key={alertIndex}
                        color={color}
                        alert={alert}
                        riskCode={riskCode}
                      />
                    )
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
