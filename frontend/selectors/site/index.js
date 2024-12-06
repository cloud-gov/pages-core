export const currentSite = (state, id) =>
  state.data.find((site) => site.id === Number(id));
export const groupSitesByOrg = (state, orgId) => {
  if (orgId === 'all-options') return state;

  const data = state.data.filter((site) => site.organizationId === Number(orgId));

  return {
    ...state,
    data,
  };
};
export default {
  currentSite,
  groupSitesByOrg,
};
