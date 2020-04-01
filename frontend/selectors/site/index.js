export const currentSite = (state, id) => state.data.find(site => site.id === Number(id));
export default { currentSite };
