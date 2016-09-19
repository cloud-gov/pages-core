import { buildActionTypes as types } from '../../constants';

const buildsReceivedType = types.BUILDS_RECEIVED;

const buildsReceived = builds => ({
  type: buildsReceivedType,
  builds
});

export {
  buildsReceived, buildsReceivedType
};
