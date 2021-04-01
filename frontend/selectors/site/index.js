import _ from 'underscore';

export const currentSite = (state, id) => state.data.find(site => site.id === Number(id));
export const groupSitesByOrg = (sites, organizations) => {
  const groupedSites = _.groupBy(sites.data, 'organization');

  if (groupedSites.undefined) {
    groupedSites.unassociated = groupedSites.undefined;
    delete groupedSites.undefined;
  }

  const orgNames = _.object(
    _.map(
      _.pluck(organizations.data, 'name'), name => [name, []]
    )
  );

  return {
    ...orgNames,
    ...groupedSites,
  };
};
export default {
  currentSite,
  groupSitesByOrg,
};
