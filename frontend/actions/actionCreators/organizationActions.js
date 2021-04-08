const organizationsFetchStartedType = 'ORGANIZATIONS_FETCH_STARTED';
const organizationsReceivedType = 'ORGANIZATIONS_RECEIVED';

const organizationsFetchStarted = () => ({
  type: organizationsFetchStartedType,
});

const organizationsReceived = organizations => ({
  type: organizationsReceivedType,
  organizations,
});

export {
  organizationsFetchStarted, organizationsFetchStartedType,
  organizationsReceived, organizationsReceivedType,
};
