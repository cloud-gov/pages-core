/* eslint-disable react/forbid-prop-types */

import React, { useCallback, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';

function SiteBuildLogTable({ buildLogs }) {
  const buildLogRef = useRef(null);

  const scrollToLast = useCallback((node) => {
    if (node) {
      // eslint-disable-next-line no-param-reassign
      node.scrollTop = node.scrollHeight;
    }
  });

  useEffect(() => scrollToLast(buildLogRef.current), [buildLogs]);

  return (
    <pre ref={buildLogRef} className="build-log">
      {buildLogs.map((source, index) => {
        const key = `build-log-span-${index}`;

        return (
          <p key={key}>{source}</p>
        );
      })}
      <p className="build-log-cursor" />
    </pre>
  );
}

SiteBuildLogTable.propTypes = {
  buildLogs: PropTypes.array.isRequired,
};

export default React.memo(SiteBuildLogTable);
