const updateRouterType = "UPDATE_ROUTER";

const updateRouter = path => ({
  type: updateRouterType,
  method: 'push',
  arguments: [ path ]
});

export { updateRouterType, updateRouter };
