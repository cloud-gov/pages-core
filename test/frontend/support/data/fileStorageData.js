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
export function getFileStorageLogsData(page = 1) {
  return {
    data: [
      {
        id: 1,
        fileKey: 'test.txt',
        description: 'UPLOAD_FILE',
        createdAt: '2024-02-14T12:00:00Z',
        email: 'user@example.com',
      },
      {
        id: 2,
        fileKey: 'folder',
        description: 'CREATE_DIRECTORY',
        createdAt: '2024-02-14T13:00:00Z',
        email: 'user@example.com',
      },
      {
        id: 3,
        fileKey: 'old.txt',
        description: 'DELETE_FILE',
        createdAt: '2024-02-14T14:00:00Z',
        email: 'user@example.com',
      },
    ],
    currentPage: page,
    totalPages: 2,
    totalItems: 10,
  };
}
