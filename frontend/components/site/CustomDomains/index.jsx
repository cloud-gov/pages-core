import React from 'react';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';

import { currentSite } from '../../../selectors/site';
import Domains from './Domains';

function CustomDomains() {
  const { id } = useParams();
  const site = useSelector(state => currentSite(state.sites, id));

  if (!site) {
    return null;
  }

  return (
    <div>
      <Domains siteId={site.id} />
    </div>
  );
}

export { CustomDomains };
export default CustomDomains;
