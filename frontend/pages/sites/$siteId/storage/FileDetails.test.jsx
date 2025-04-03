import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import FileDetails from './FileDetails';
import prettyBytes from 'pretty-bytes';

jest.mock('pretty-bytes', () => ({
  __esModule: true,
  default: jest.fn(),
}));

describe('FileDetails', () => {
  const mockOnDelete = jest.fn();
  const mockOnClose = jest.fn();
  const fileProps = {
    id: 20,
    name: 'test-document.pdf',
    fullPath: 'https://example.com/files/test-document.pdf',
    lastModifiedBy: 'user@example.com',
    lastModifiedAt: '2025-02-19T12:00:00Z',
    size: 1048576, // 1MB
    mimeType: 'application/pdf',
    onDelete: mockOnDelete,
    onClose: mockOnClose,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    prettyBytes.mockReturnValue('1 MB');
  });

  it('renders file details correctly', () => {
    render(
      <MemoryRouter>
        <FileDetails {...fileProps} />
      </MemoryRouter>,
    );

    // File name
    expect(screen.getByText(fileProps.name)).toBeInTheDocument();

    // Full path (link)
    expect(screen.getByRole('link', { name: fileProps.fullPath })).toHaveAttribute(
      'href',
      fileProps.fullPath,
    );

    // Uploaded by
    expect(screen.getByText(fileProps.lastModifiedBy)).toBeInTheDocument();

    // Uploaded on (formatted date check)
    expect(screen.getByText(/Feb 19, 2025/i)).toBeInTheDocument();

    // File size
    expect(screen.getByText('1 MB')).toBeInTheDocument();

    // MIME type
    expect(screen.getByText(fileProps.mimeType)).toBeInTheDocument();
  });

  it('calls onClose when the close button is clicked', () => {
    render(
      <MemoryRouter>
        <FileDetails {...fileProps} />
      </MemoryRouter>,
    );

    const closeButton = screen.getByTitle('close file details');
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('calls onDelete when the delete button is clicked', () => {
    render(
      <MemoryRouter>
        <FileDetails {...fileProps} />
      </MemoryRouter>,
    );

    const deleteButton = screen.getByRole('button', { name: /delete/i });
    fireEvent.click(deleteButton);

    expect(mockOnDelete).toHaveBeenCalledTimes(1);
    expect(mockOnDelete).toHaveBeenCalledWith({ type: 'file', id: fileProps.id });
  });

  it('renders a working download link', () => {
    render(
      <MemoryRouter>
        <FileDetails {...fileProps} />
      </MemoryRouter>,
    );

    const downloadLink = screen.getByRole('link', { name: /download/i });
    expect(downloadLink).toHaveAttribute('href', fileProps.fullPath);
    expect(downloadLink).toHaveAttribute('download');
  });

  it('renders nothing if given an invalid id', () => {
    const invalidProps = { ...fileProps, id: 0 };
    const { container } = render(
      <MemoryRouter>
        <FileDetails {...invalidProps} />
      </MemoryRouter>,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
