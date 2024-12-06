export const getOrgById = (state, id) => state.data.find((org) => org.id === Number(id));

export const getOrgData = (state) => {
  const { data } = state;
  if (!data || data.length === 0) {
    return null;
  }

  return data;
};

export const hasOrgs = (state) => {
  const { data } = state;

  return !(!data || data.length === 0);
};

export const orgFilterOptions = (state) => {
  const data = getOrgData(state);

  if (!data) return null;

  const keyValues = data.map((org) => ({
    id: org.id,
    name: org.name,
  }));
  keyValues.unshift({
    id: 'all-options',
    name: 'All',
  });

  return keyValues;
};

export default {
  getOrgById,
  getOrgData,
  hasOrgs,
  orgFilterOptions,
};
