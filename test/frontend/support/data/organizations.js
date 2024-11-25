import { randomUUID } from 'node:crypto';

export function createFixtureOrg({
  createdAt = Date.now().toString(),
  id = randomUUID(),
  name = 'an-organization',
  updatedAt = Date.now().toString(),
} = {}) {
  return {
    createdAt,
    id,
    name,
    updatedAt,
  };
}
