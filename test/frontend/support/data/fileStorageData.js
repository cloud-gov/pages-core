export function generateMockFiles(page = 1) {
  return Array.from({ length: 10 }, (_, index) => ({
    id: page * 10 + index,
    name: `file-page-${page}-${index}.txt`,
    type: 'text/plain',
    createdAt: new Date('2024-01-06T00:00:00.000Z').toISOString(),
    updatedAt: new Date('2024-01-06T00:00:00.000Z').toISOString(),
  }));
}

export function getFileStorageData(page = 1) {
  return {
    currentPage: page,
    totalPages: 3,
    totalItems: 102,
    data: generateMockFiles(page),
  };
}
