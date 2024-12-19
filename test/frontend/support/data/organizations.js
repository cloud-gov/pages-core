import { randomUUID } from 'node:crypto';

export function createFixtureOrg({
  createdAt = Date.now().toString(),
  id = randomUUID(),
  name = 'an-organization',
  updatedAt = Date.now().toString(),
  isActive = true,
  isSandbox = false,
  daysUnitSandboxCleaning = null,
} = {}) {
  return {
    createdAt,
    id,
    name,
    updatedAt,
    isActive,
    isSandbox,
    daysUnitSandboxCleaning,
  };
}
