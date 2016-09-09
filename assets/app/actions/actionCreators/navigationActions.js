import { navigationTypes as types } from '../../constants';

const updateRouterType = types.UPDATE_ROUTER;

const updateRouter = path => ({
  type: updateRouterType,
  method: 'push',
  arguments: [ path ]
});

export { updateRouterType, updateRouter };
