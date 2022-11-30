/* eslint-disable react/forbid-prop-types */

import React, { useRef } from 'react';
import PropTypes from 'prop-types';
import LoadingIndicator from '../LoadingIndicator';

function SiteBuildLogTable({ buildLogs }) {
  const lastSpanRef = useRef(null);
  const buildLogLength = buildLogs.length;

  /* Keeping this commented out to think about if we want to scroll with new logs */
  // const scrollToLast = useCallback((node) => {
  //   if (node) {
  //     node.scrollIntoView()
  //   }
  // });
  // useEffect(() => scrollToLast(lastSpanRef.current), [buildLogs]);

  if (!buildLogs || buildLogLength < 1) {
    return <LoadingIndicator />;
  }

  return (
    <pre className="build-log">
      {buildLogs.map((source, index) => {
        const key = `build-log-span-${index}`;

        return (
          <p key={key}>{source}</p>
        );
      })}
      <p ref={lastSpanRef} className="build-log-cursor" />
    </pre>
  );
}

SiteBuildLogTable.propTypes = {
  buildLogs: PropTypes.array.isRequired,
};

export default React.memo(SiteBuildLogTable);
