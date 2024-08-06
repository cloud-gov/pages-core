import React from 'react';
import PropTypes from 'prop-types';
import { plural } from './utils';

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
              ${totalFound} ${plural(totalFound, 'issue')}
              in ${totalLocations} ${plural(totalLocations, 'location')}
            `}
        </b>
        {`across ${totalUrls} scanned ${plural(totalUrls, 'page')} for this site. `}
        {children}
      </p>
    </div>
  </section>
);

ScanAlert.propTypes = {
  totalFound: PropTypes.number,
  totalLocations: PropTypes.number,
  totalUrls: PropTypes.number,
  children: PropTypes.node,
};

export default ScanAlert;
