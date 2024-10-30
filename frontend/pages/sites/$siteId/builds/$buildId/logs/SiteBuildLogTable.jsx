import React, { useCallback, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';

function SiteBuildLogTable({ buildLogs, buildState }) {
  const buildLogRef = useRef(null);
  const scrollType = ['created', 'processing', 'queued', 'tasked'].includes(buildState)
    ? 'smooth'
    : 'none';

  const scrollToLast = useCallback((node, state) => {
    if (node && ['created', 'error', 'processing', 'queued', 'tasked'].includes(state)) {
      node.scrollTop = node.scrollHeight;
    }
  });

  useEffect(() => scrollToLast(buildLogRef.current, buildState), [buildLogs, buildState]);

  return (
    <pre
      ref={buildLogRef}
      className="build-log"
      style={{
        scrollBehavior: scrollType,
      }}
    >
      {buildLogs.map((source, index) => {
        const key = `build-log-span-${index}`;
        let style = null;
        if (source.includes('[main]')) {
          style = {
            fontWeight: 'bold',
          };
        } else if (source.includes('[monitor]')) {
          style = {
            opacity: 0.7,
          };
        }

        return (
          <p style={style} key={key}>
            {source}
          </p>
        );
      })}
      <p className="build-log-cursor" />
    </pre>
  );
}

SiteBuildLogTable.propTypes = {
  buildLogs: PropTypes.array.isRequired,
  buildState: PropTypes.string,
};

SiteBuildLogTable.defaultProps = {
  buildState: '',
};

export default React.memo(SiteBuildLogTable);
