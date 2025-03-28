import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import '@testing-library/jest-dom';
import { FileStorageLogs } from './index';
import useFileStorageLogs from '@hooks/useFileStorageLogs';
// eslint-disable-next-line max-len
import { getFileStorageLogsData } from '../../../../../../test/frontend/support/data/fileStorageData';

import { currentSite } from '@selectors/site';
import { useSelector } from 'react-redux';

// Mock the hooks and utilities
jest.mock('@hooks/useFileStorageLogs');
jest.mock('@selectors/site');
jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: jest.fn(),
}));

// Mock data
const mockLogs = getFileStorageLogsData().data;

const mockSite = {
  id: '123',
  fileStorageServiceId: 'fs-123',
};

// Setup function
const setup = (initialEntries = ['/sites/123/storage/logs']) => {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <Routes>
        <Route path="/sites/:id/storage/logs" element={<FileStorageLogs />} />
      </Routes>
    </MemoryRouter>,
  );
};

describe('storage/logs/index', () => {
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Setup default mock implementations
    currentSite.mockReturnValue(mockSite);
    useSelector.mockImplementation((selector) =>
      selector({ sites: { data: [mockSite] } }),
    );
    useFileStorageLogs.mockReturnValue({
      data: mockLogs,
      isPending: false,
      error: null,
      currentPage: 1,
      totalPages: 2,
      totalItems: 20,
    });
  });

  it('renders the file storage logs table', () => {
    setup();

    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getAllByText(/user@example.com/i)).toHaveLength(mockLogs.length);
    expect(screen.getByText(/uploaded/i)).toBeInTheDocument();
    expect(screen.getByText(/\/test.txt/i)).toBeInTheDocument();
  });

  it('shows loading state', () => {
    useFileStorageLogs.mockReturnValue({
      data: [],
      isPending: true,
      error: null,
    });

    setup();

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('shows a message if there is no file storage service id for this site', () => {
    const siteWithoutFileStorage = {
      id: '123',
    };

    currentSite.mockReturnValueOnce(siteWithoutFileStorage);
    useSelector.mockImplementationOnce((selector) =>
      selector({ sites: { data: [siteWithoutFileStorage] } }),
    );

    setup();

    expect(
      screen.getByText(/This site does not have Public File Storage enabled/i),
    ).toBeInTheDocument();
    expect(useFileStorageLogs).not.toHaveBeenCalled();
  });

  it('shows error state', () => {
    useFileStorageLogs.mockReturnValue({
      data: [],
      isPending: false,
      error: new Error('Failed to load'),
      errorMessage: 'Failed to load',
    });

    setup();

    expect(screen.getByText(/Failed to load/i)).toBeInTheDocument();
  });

  it('parses different action types correctly', () => {
    useFileStorageLogs.mockReturnValue({
      data: mockLogs,
      isPending: false,
      error: null,
    });

    setup();

    expect(screen.getByText(/uploaded/i)).toBeInTheDocument();
    expect(screen.getByText(/created/i)).toBeInTheDocument();
    expect(screen.getByText(/deleted/i)).toBeInTheDocument();
  });
});
