import React from 'react';
import * as utils from './utils';

const ScanAlert = ({
  totalFound = 0, totalLocations = 0, totalUrls = 0, children,
}) => (
  <section
    className={`usa-alert usa-alert--${totalFound > 0 ? 'error' : 'success'}`}
  >
    <div className="usa-alert__body">
      <p className="usa-alert__text">
        We’ve found
        <b>
          {`
              ${totalFound} ${utils.plural(totalFound, 'issue')}
              in ${totalLocations} ${utils.plural(totalLocations, 'location')}
            `}
        </b>
        {`across ${totalUrls} scanned ${utils.plural(totalUrls, 'page')} for this site. `}
        {children}
      </p>
    </div>
  </section>
);
export default ScanAlert;
