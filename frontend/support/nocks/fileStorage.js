import nock from 'nock';
import { fileStorageData } from '../../../test/frontend/support/data/fileStorageData';

const BASE_URL = 'http://localhost:80';

export async function getFileStorageFiles(
  { fileStorageId, path, sortKey, sortOrder, page },
  { times = 1 } = {},
) {
  const params = new URLSearchParams({ path, sortKey, sortOrder, page });
  nock(BASE_URL)
    .get(`/v0/file-storage/${fileStorageId}?${params.toString()}`)
    .times(times)
    .reply(200, fileStorageData);
}

export async function getFileStorageFilesError({
  fileStorageId,
  path,
  sortKey,
  sortOrder,
  page,
}) {
  const params = new URLSearchParams({ path, sortKey, sortOrder, page });
  nock(BASE_URL)
    .get(`/v0/file-storage/${fileStorageId}?${params.toString()}`)
    .reply(400, { error: true, message: 'Failed to fetch public files' });
}

export async function deletePublicItem(fileStorageId, fileId) {
  nock(BASE_URL)
    .delete(`/v0/file-storage/${fileStorageId}/file/${fileId}`)
    .reply(200, { success: true });
}

export async function deletePublicItemError(fileStorageId, fileId) {
  nock(BASE_URL)
    .delete(`/v0/file-storage/${fileStorageId}/file/${fileId}`)
    .reply(400, { error: true, message: 'Failed to delete file' });
}
