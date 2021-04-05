export const currentSite = (state, id) => state.data.find(site => site.id === Number(id));
export const groupSitesByOrg = (state, orgId) => {
  if (orgId === 'all-options') return state;

  if (orgId === 'unassociated') {
    const data = state.data.filter(site => !site.organizationId);

    return {
      ...state,
      data,
    };
  }

  const data = state.data.filter(site => site.organizationId === Number(orgId));

  return {
    ...state,
    data,
  };
};
export default {
  currentSite,
  groupSitesByOrg,
};
