/* eslint-disable import/prefer-default-export */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import _ from 'underscore';
import api from '../util/federalistApi';
import { useSiteBranchConfigs } from './useSiteBranchConfigs';

const initialDomainsState = {
  isLoading: true,
  error: null,
  data: [],
};

const initialDomainState = siteId => ({
  error: null,
  data: {
    siteId,
    names: '',
    siteBranchConfigId: '',
  },
});

export const useSiteDomains = (siteId, domainId) => {
  const [domains, setDomains] = useState(initialDomainsState);

  useEffect(() => {
    api
      .fetchSiteDomains(siteId)
      .then((results) => {
        setDomains({ ...domains, isLoading: false, data: results });
      })
      .catch(error => setDomains({
        ...domains,
        isLoading: false,
        state: 'error',
        error: error.message,
      }));
  }, [siteId, domainId]);

  function removeDomain(id) {
    const filtered = domains.data.filter(d => d.id !== id);
    return setDomains({
      ...domains,
      data: filtered,
    });
  }

  function deleteSiteDomain(id) {
    const selected = domains.data.find(d => d.id === id);

    if (!selected) {
      // eslint-disable-next-line no-alert
      return window.alert('This custom domain was not found.');
    }

    if (selected.state !== 'pending') {
      // eslint-disable-next-line no-alert
      window.alert(
        `You cannot delete this custom domain since it is ${selected.state}.
        Please email pages-support@cloud.gov to take down ${selected.names}`
      );
    }

    if (
      selected.state === 'pending'
      // eslint-disable-next-line no-alert
      && window.confirm(
        `Are you sure you want to delete the custom domain ${selected.names}?`
      )
    ) {
      return api
        .deleteSiteDomain(siteId, id)
        .then(() => removeDomain(id))
        .catch(error => setDomains({ ...domains, error }));
    }

    // eslint-disable-next-line no-alert
    return window.confirm(
      `Unable to delete the custom domain ${selected.names}?`
    );
  }

  return {
    domains,
    setDomains,
    deleteSiteDomain,
  };
};

export const useSiteDomain = (siteIdArg, domainIdArg) => {
  const siteId = parseInt(siteIdArg, 10);
  const domainId = parseInt(domainIdArg, 10);
  const navigate = useNavigate();
  const { siteBranchConfigs } = useSiteBranchConfigs(siteId, {
    noPreviews: true,
  });
  const { domains } = useSiteDomains(siteId);
  const [availableConfigs, setAvailableConfigs] = useState(
    siteBranchConfigs.data
  );
  const [domain, setDomain] = useState(initialDomainState);

  useEffect(() => {
    if (domainId) {
      api
        .fetchSiteDomains(siteId)
        .then((results) => {
          const currentDomain = results.find(r => r.id === domainId);

          if (!currentDomain) {
            setDomain({
              ...domain,
              error: { message: 'No domain found with this ID.' },
            });
          } else {
            setDomain({ ...domain, data: currentDomain });
          }
        })
        .catch(error => setDomain({
          ...domain,
          isLoading: false,
          error: error.message,
        }));
    }
  }, [siteId, domainId]);

  useEffect(() => {
    if (domains.data && siteBranchConfigs.data) {
      const otherDomains = domains.data
        .filter(d => d.id !== domainId)
        .map(d => d.siteBranchConfigId);

      const updatedAvailable = siteBranchConfigs.data.filter(
        sbc => !otherDomains.includes(sbc.id)
      );

      setAvailableConfigs(updatedAvailable);
    }
  }, [siteId, domainId, domains, siteBranchConfigs]);

  function setDomainValues({ names, siteBranchConfigId }) {
    const updated = _.omit(
      { names, siteBranchConfigId },
      x => x === undefined || x === null
    );

    return setDomain({
      ...domain,
      data: { ...domain.data, ...updated },
    });
  }

  function createSiteDomain({ names, siteBranchConfigId }) {
    return api
      .createSiteDomain(siteId, names, siteBranchConfigId)
      .then(results => setDomain({ ...domain, isLoading: false, data: results }))
      .then(() => navigate(`/sites/${siteId}/custom-domains`))
      .catch(error => setDomain({
        ...domain,
        isLoading: false,
        error: error.message,
      }));
  }

  function updateSiteDomain() {
    const { data } = domain;

    if (data.state === 'pending') {
      return api
        .updateSiteDomain(siteId, domainId, data)
        .then((results) => {
          if (!results) {
            throw new Error({
              message: `Unable to update domain ${data.names}}`,
            });
          }
        })
        .then(() => navigate(`/sites/${siteId}/custom-domains`))
        .catch(error => setDomain({ ...domain, error }));
    }
    // eslint-disable-next-line no-alert
    return window.alert(
      `You cannot edit this custom domain since it is ${domain.state}.
        Please email pages-support@cloud.gov to edit ${domain.names}`
    );
  }

  return {
    availableConfigs,
    domain,
    setDomainValues,
    createSiteDomain,
    updateSiteDomain,
  };
};
