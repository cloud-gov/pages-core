import nock from 'nock';
import {
  getFileStorageData,
  getFileStorageLogsData,
} from '../../../test/frontend/support/data/fileStorageData';

const BASE_URL = 'http://localhost:80';

export async function getFileStorageFiles(
  { fileStorageId, path = '/', sortKey = null, sortOrder = null, page = 1 },
  { times = 1 } = {},
) {
  const params = new URLSearchParams();

  params.append('path', path);
  if (sortKey) params.append('sortKey', sortKey);
  if (sortOrder) params.append('sortOrder', sortOrder);
  if (page) params.append('page', page);

  const expectedUrl = `/v0/file-storage/${fileStorageId}`;
  const expectedQuery = Object.fromEntries(params.entries());

  nock(BASE_URL)
    .get(expectedUrl)
    .query(expectedQuery)
    .times(times)
    .reply(200, getFileStorageData(page));
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

export async function uploadPublicFile(fileStorageId, _parent, _file) {
  nock(BASE_URL)
    .post(`/v0/file-storage/${fileStorageId}/upload`, () => true)
    .matchHeader('content-type', /multipart\/form-data/)
    .reply(200, { success: true });
}

export async function uploadPublicFileError(
  fileStorageId,
  parent,
  file,
  message = 'Upload failed.',
) {
  nock(BASE_URL)
    .post(`/v0/file-storage/${fileStorageId}/upload`)
    .reply(400, { error: true, message });
}

export async function createPublicDirectory(fileStorageId, parent, name) {
  nock(BASE_URL)
    .post(`/v0/file-storage/${fileStorageId}/directory`, { parent, name })
    .reply(200, { success: true });
}

export async function createPublicDirectoryError(
  fileStorageId,
  parent,
  name,
  message = 'Could not create folder.',
) {
  nock(BASE_URL)
    .post(`/v0/file-storage/${fileStorageId}/directory`, { parent, name })
    .reply(400, { error: true, message });
}

export async function getFileStorageLogs(
  { fileStorageServiceId, page = 1 },
  { times = 1 } = {},
) {
  nock(BASE_URL)
    .get(`/v0/file-storage/${fileStorageServiceId}/user-actions/`)
    .query({ page })
    .times(times)
    .reply(200, getFileStorageLogsData(page));
}

export async function getFileStorageLogsError({ fileStorageServiceId, page = 1 }) {
  nock(BASE_URL)
    .get(`/v0/file-storage/${fileStorageServiceId}/user-actions/`)
    .query({ page })
    .reply(400, { error: true, message: 'Failed to fetch storage logs' });
}
