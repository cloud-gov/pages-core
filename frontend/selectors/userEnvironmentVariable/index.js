export function siteUserEnvironmentVariables(state, siteId) {
  return state[siteId] || { isLoading: false, data: [] };
}
export default { siteUserEnvironmentVariables };
