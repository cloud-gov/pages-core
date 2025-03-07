import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import NewFileOrFolder from './NewFileOrFolder';
import prettyBytes from 'pretty-bytes';

jest.mock('pretty-bytes', () => jest.fn());
const mockOnUpload = jest.fn();
const mockOnCreateFolder = jest.fn();

const renderComponent = (props = {}) => {
  return render(
    <NewFileOrFolder
      onUpload={mockOnUpload}
      onCreateFolder={mockOnCreateFolder}
      {...props}
    />,
  );
};

describe('NewFileOrFolder Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
    prettyBytes.mockReturnValue('4 KB');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('renders initial state with "Upload files" and "New folder" buttons', () => {
    renderComponent();
    expect(screen.getByRole('button', { name: 'Upload files' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'New folder' })).toBeInTheDocument();
  });

  test('shows file upload UI when "Upload files" is clicked', async () => {
    renderComponent();

    fireEvent.click(screen.getByRole('button', { name: 'Upload files' }));

    await waitFor(() => {
      expect(screen.getByLabelText('Upload files')).toBeInTheDocument();
    });
  });

  test('shows folder input when "New folder" is clicked', async () => {
    renderComponent();

    fireEvent.click(screen.getByRole('button', { name: 'New folder' }));

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Enter folder name')).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Create folder' })).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    });
  });

  test('calls onCreateFolder when user names and creates a folder', async () => {
    renderComponent();

    fireEvent.click(screen.getByRole('button', { name: 'New folder' }));

    const input = screen.getByPlaceholderText('Enter folder name');
    await userEvent.type(input, 'New Folder');

    fireEvent.click(screen.getByRole('button', { name: 'Create folder' }));

    await waitFor(() => {
      expect(mockOnCreateFolder).toHaveBeenCalledWith('New Folder');
    });

    expect(screen.queryByPlaceholderText('Enter folder name')).not.toBeInTheDocument();
  });

  test('prevents naming a folder as " " (only whitespace)', async () => {
    renderComponent();

    fireEvent.click(screen.getByRole('button', { name: 'New folder' }));

    const input = screen.getByPlaceholderText('Enter folder name');
    await userEvent.type(input, ' ');

    expect(screen.getByRole('button', { name: 'Create folder' })).toBeDisabled();
  });

  test('shows an error when backend erros that folder already exists', async () => {
    const backendError = new Error('A folder with this name already exists.');
    mockOnCreateFolder.mockRejectedValueOnce(backendError);

    renderComponent();

    fireEvent.click(screen.getByRole('button', { name: 'New folder' }));

    const input = screen.getByPlaceholderText('Enter folder name');
    await userEvent.type(input, 'Existing Folder');

    fireEvent.click(screen.getByRole('button', { name: 'Create folder' }));

    await waitFor(() => {
      expect(
        screen.getByText(/A folder with this name already exists/i),
      ).toBeInTheDocument();
    });

    expect(mockOnCreateFolder).toHaveBeenCalledWith('Existing Folder');
  });

  test('shows an error message when folder creation fails in backend', async () => {
    const mockError = new Error('Failed to create folder.');
    mockOnCreateFolder.mockRejectedValueOnce(mockError);

    renderComponent();

    fireEvent.click(screen.getByRole('button', { name: 'New folder' }));

    const input = screen.getByPlaceholderText('Enter folder name');
    await userEvent.type(input, 'Bad Folder');

    fireEvent.click(screen.getByRole('button', { name: 'Create folder' }));

    await waitFor(() => {
      expect(screen.getByText('Failed to create folder.')).toBeInTheDocument();
    });

    expect(mockOnCreateFolder).toHaveBeenCalledWith('Bad Folder');
  });

  test('cancels folder creation when "Cancel" is clicked', async () => {
    renderComponent();

    fireEvent.click(screen.getByRole('button', { name: 'New folder' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    await waitFor(() => {
      expect(screen.queryByPlaceholderText('Folder name')).not.toBeInTheDocument();
    });
  });
  test('hides file drop zone when canceling file upload', async () => {
    renderComponent();

    fireEvent.click(screen.getByRole('button', { name: 'Upload files' }));
    // show the file uploader
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Cancel upload' })).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.getByLabelText('Upload files')).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(
        screen.queryByRole('button', { name: 'Upload files' }),
      ).not.toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Cancel upload' }));
    // hide the file uploader
    await waitFor(() => {
      expect(
        screen.queryByRole('button', { name: 'Cancel upload' }),
      ).not.toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.queryByLabelText('Upload files')).not.toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Upload files' })).toBeInTheDocument();
    });
  });
});
