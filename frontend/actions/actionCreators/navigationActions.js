const updateRouterType = "UPDATE_ROUTER";

const updateRouter = (path, method) => ({
  type: updateRouterType,
  method: method,
  arguments: [ path ]
});

const pushRouterHistory = (path) => updateRouter(path, 'push');
const replaceRouterHistory = path => updateRouter(path, 'replace');

export { updateRouterType, pushRouterHistory, replaceRouterHistory };
