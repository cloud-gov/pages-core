import React from 'react';
import { useSelector } from 'react-redux';
import { Link, useParams } from 'react-router-dom';
import { currentSite } from '@selectors/site';
import UsaIcon from '@shared/UsaIcon';
import { useSiteDomains } from '@hooks';

import Domains from './components/Domains';

function DomainList() {
  const { id } = useParams();
  const { domains, deleteSiteDomain } = useSiteDomains(id);
  const site = useSelector(state => currentSite(state.sites, id));

  if (!site || domains.isLoading) {
    return null;
  }

  return (
    <div>
      <Domains
        siteId={site.id}
        domains={domains}
        handleDelete={deleteSiteDomain}
      />
      <div
        style={{
          position: 'relative',
          margin: '2em 0',
        }}
      >
        <Link
          to={`/sites/${id}/custom-domains/new`}
          role="button"
          className="usa-button button-add-website margin-right-0"
          alt="Add a new site domain"
        >
          <UsaIcon name="add" />
          {' '}
          Add new domain
        </Link>
      </div>
    </div>
  );
}

export { DomainList };
export default DomainList;
