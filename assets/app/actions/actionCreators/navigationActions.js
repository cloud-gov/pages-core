const updateRouterType = "UPDATE_ROUTER";

const updateRouter = (path, method) => ({
  type: updateRouterType,
  method: method,
  arguments: [ path ]
});

export { updateRouterType, updateRouter };
