export const getOrgById = (state, id) => state.data.find(site => site.id === Number(id));

export const orgFilter = (state) => {
  if (!state.data) return null;

  const keyValues = state.data.map(org => ({ id: org.id, name: org.name }));
  keyValues.unshift({ id: 'all-options', name: 'All' });
  keyValues.push({ id: 'unassociated', name: 'Sites without an organization' });

  return keyValues;
};

export default {
  getOrgById,
  orgFilter,
};
