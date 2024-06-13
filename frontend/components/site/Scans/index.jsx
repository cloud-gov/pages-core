import React from 'react';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';

import { currentSite } from '../../../selectors/site';
import { useBuildTasksForSite } from '../../../hooks/useBuildTasksForSite';

function Scans() {
  const { id } = useParams();
  const site = useSelector(state => currentSite(state.sites, id));
  const { buildTasks: scans } = useBuildTasksForSite(id);
  if (!site || !scans) {
    return null;
  }

  return (
    <div>
      <ul>
        {scans.map(scan => (
          <li key={scan.id}>{JSON.stringify(scan)}</li>
        ))}
      </ul>
    </div>
  );
}

export { Scans };
export default Scans;
