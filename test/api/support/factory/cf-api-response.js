const crypto = require('crypto');

const relationshipBuilder = (guid) => {
  const value = guid || crypto.randomUUID();
  return {
    data: { guid: value },
  };
};

const createCFAPIResource = ({
  name,
  guid,
  serviceInstanceGuid,
  servicePlanGuid,
  spaceGuid,
  ...props
} = {}) => {
  const service_instance = relationshipBuilder(serviceInstanceGuid);
  const service_plan = relationshipBuilder(servicePlanGuid);
  const space = relationshipBuilder(spaceGuid);

  return {
    guid: guid || crypto.randomUUID(),
    name: name || `name-${crypto.randomUUID()}`,
    relationships: {
      service_instance,
      service_plan,
      space,
    },
    ...props,
  };
};

const createCFAPIResourceList = ({ totalPages = 1, totalResults, resources = [] }) => {
  const createdResources = resources.map((r) => createCFAPIResource(r));
  const totalResultsCount = totalResults || createdResources.length;

  return {
    pagination: {
      total_results: totalResultsCount,
      total_pages: totalPages,
    },
    resources: createdResources,
  };
};

module.exports = {
  createCFAPIResource,
  createCFAPIResourceList,
};
