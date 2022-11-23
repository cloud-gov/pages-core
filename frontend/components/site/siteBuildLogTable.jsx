import React, { useCallback, useEffect, useRef } from 'react';
import LoadingIndicator from '../LoadingIndicator';

import { BUILD_LOG_DATA } from '../../propTypes';
import { groupLogs } from '../../util';

function SiteBuildLogTable({ buildLogs }) {
  const lastSpanRef = useRef(null);
  const groupedLogs = groupLogs(buildLogs);
  const buildLogLength = groupedLogs.length;

  const scrollToLast = useCallback((node) => {
    if (node) {
      node.scrollIntoView();
    }
  });

  useEffect(() => scrollToLast(lastSpanRef.current), [buildLogs]);

  if (!groupedLogs || groupLogs.length < 1) {
    return <LoadingIndicator />;
  }

  return (
    <pre className="build-log">
      {groupedLogs.map((source, index) => {
        const key = `build-log-span-${index}`;
        if ((buildLogLength - 1) === index) {
          return <span ref={lastSpanRef} key={key}>{source}</span>;
        }

        return (
          <span key={key}>{source}</span>
        );
      })}
    </pre>
  );
}

SiteBuildLogTable.propTypes = {
  buildLogs: BUILD_LOG_DATA.isRequired,
};

export default React.memo(SiteBuildLogTable);
