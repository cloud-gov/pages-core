
import React from 'react';
import ScanFinding from './ScanFinding';
import * as utils from './utils.js';

const ScanFindings = ({ alerts, groupedAlerts }) => {
  return (
    <>
      {(alerts.length && groupedAlerts) ? (
        utils.severity.map(({ riskCode, name, color }) => (
          <React.Fragment key={riskCode}>
            <a id={`${name}-findings`}></a>
            {groupedAlerts[riskCode] && groupedAlerts[riskCode].length > 0 && (
              <>
              <h2 className="font-heading-xl margin-bottom-1 margin-top-3">
                {name} {riskCode < 1 && ' or unknown'} risk findings <span className="font-body-xl text-secondary-vivid">({groupedAlerts[riskCode].length})</span>
              </h2>

                <div className="margin-y-2 padding-bottom-2">
                  {groupedAlerts[riskCode].map((alert, alertIndex) => (
                    !!alert?.alertRef && (
                        <ScanFinding
                        key={alertIndex}
                        color={color}
                        alert={alert}
                      />
                    )
                  ))}
                </div>
              </>
            )}
          </React.Fragment>
        ))
      ) : (
        <section className="usa-alert usa-alert--success maxw-tablet margin-y-3">
          <div className="usa-alert__body">
            <p className="usa-alert__text">No vulnerabilities found.</p>
          </div>
        </section>
      )}
    </>
  );
};

export default ScanFindings;
