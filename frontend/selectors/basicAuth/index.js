export function siteBasicAuth(state, siteId) {
  return state[siteId] || { isLoading: false, data: {} };
}
export default { siteBasicAuth };
