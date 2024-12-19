export function createFixtureSite({
  createdAt = new Date().toISOString(),
  publishedAt = new Date().toISOString(),
  repoLastVerified = new Date().toISOString(),
  id = Math.floor(Math.random() * 1000),
  name = 'test-site',
  repository = 'test-repo',
  owner = 'test-owner',
  isActive = true,
} = {}) {
  return {
    createdAt,
    publishedAt,
    repoLastVerified,
    id,
    name,
    repository,
    owner,
    isActive,
  };
}
