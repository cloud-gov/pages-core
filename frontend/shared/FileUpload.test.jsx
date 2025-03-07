import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import FileUpload from './FileUpload';
import prettyBytes from 'pretty-bytes';

jest.mock('pretty-bytes', () => jest.fn());

const mockOnUpload = jest.fn();
const mockOnCancel = jest.fn();
const mockFile = new File(['file content'], 'test-file.txt', { type: 'text/plain' });

const renderFileUpload = (props = {}) => {
  return render(
    <FileUpload onUpload={mockOnUpload} onCancel={mockOnCancel} {...props} />,
  );
};

describe('FileUpload Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
    prettyBytes.mockReturnValue('4 KB');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('renders initial state correctly', () => {
    renderFileUpload();
    expect(screen.getByText(/Drag files here or/i)).toBeInTheDocument();
    expect(screen.getByLabelText('File uploader')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Upload' })).toBeDisabled();
  });

  test('select a file and displays its name and size', async () => {
    renderFileUpload();
    const fileInput = screen.getByLabelText('Upload files');

    fireEvent.change(fileInput, { target: { files: [mockFile] } });

    await waitFor(() => {
      expect(screen.getByText('test-file.txt')).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.getByText('4 KB')).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: 'Upload' })).toBeEnabled();
  });
  test('displays correct singular or plural file count', async () => {
    renderFileUpload();
    const fileInput = screen.getByLabelText('Upload files');

    fireEvent.change(fileInput, { target: { files: [mockFile] } });
    await screen.findByText('1 file selected');

    const secondFile = new File(['more content'], 'another-file.txt', {
      type: 'text/plain',
    });
    fireEvent.change(fileInput, { target: { files: [mockFile, secondFile] } });

    await screen.findByText('2 files selected');
  });

  test('removes a selected file when clicking "x"', async () => {
    renderFileUpload();
    const fileInput = screen.getByLabelText('Upload files');

    fireEvent.change(fileInput, { target: { files: [mockFile] } });
    await screen.findByText('test-file.txt');

    fireEvent.click(screen.getByRole('button', { name: `Remove test-file.txt` }));

    await waitFor(() =>
      expect(screen.queryByText('test-file.txt')).not.toBeInTheDocument(),
    );
    expect(screen.getByRole('button', { name: 'Upload' })).toBeDisabled();
  });

  test('displays an error message when a file exceeds the size limit', async () => {
    const largeFile = new File(['fake content'], 'large-file.txt', {
      type: 'text/plain',
    });

    renderFileUpload();
    const fileInput = screen.getByLabelText('Upload files');

    jest
      .spyOn(global.File.prototype, 'size', 'get')
      .mockReturnValue(300 * 1024 * 1024 + 1);

    fireEvent.change(fileInput, { target: { files: [largeFile] } });

    await waitFor(() => {
      expect(screen.getByText(/exceeds the 250MB limit/i)).toBeInTheDocument();
    });

    jest.restoreAllMocks();
  });
  test('clears error message when a valid file is selected', async () => {
    renderFileUpload();
    const fileInput = screen.getByLabelText('Upload files');

    jest
      .spyOn(global.File.prototype, 'size', 'get')
      .mockReturnValue(300 * 1024 * 1024 + 1); // Mock an oversized file

    fireEvent.change(fileInput, { target: { files: [mockFile] } });
    await waitFor(() => {
      expect(screen.getByText(/exceeds the 250MB limit/i)).toBeInTheDocument();
    });

    jest.restoreAllMocks();
    fireEvent.change(fileInput, { target: { files: [mockFile] } });

    await waitFor(() => {
      expect(screen.queryByText(/exceeds the 250MB limit/i)).not.toBeInTheDocument();
    });
  });

  test('triggers onUpload with selected files', async () => {
    renderFileUpload();
    const fileInput = screen.getByLabelText('Upload files');

    fireEvent.change(fileInput, { target: { files: [mockFile] } });
    await screen.findByText('test-file.txt');

    fireEvent.click(screen.getByRole('button', { name: 'Upload' }));

    expect(mockOnUpload).toHaveBeenCalledWith([mockFile]);
  });

  test('triggers onCancel and clears selected files', async () => {
    renderFileUpload();
    const fileInput = screen.getByLabelText('Upload files');

    fireEvent.change(fileInput, { target: { files: [mockFile] } });
    await screen.findByText('test-file.txt');

    fireEvent.click(screen.getByRole('button', { name: /cancel upload/i }));

    await waitFor(() =>
      expect(screen.queryByText('test-file.txt')).not.toBeInTheDocument(),
    );
    expect(mockOnCancel).toHaveBeenCalled();
  });

  test('handles drag-and-drop file selection', async () => {
    renderFileUpload();
    const dropzone = screen.getByLabelText('File uploader');
    fireEvent.dragOver(dropzone);
    fireEvent.drop(dropzone, { dataTransfer: { files: [mockFile] } });

    await screen.findByText('test-file.txt');
  });
  test('sets dragging state when file is dragged over and clears on leave', () => {
    renderFileUpload();
    const dragzone = screen.getByTestId('drag');
    const dropzone = screen.getByLabelText('File uploader');

    fireEvent.dragOver(dropzone);
    expect(dragzone).toHaveClass('usa-file-input--drag');

    fireEvent.dragLeave(dropzone);
    expect(dragzone).not.toHaveClass('usa-file-input--drag');
  });

  test('opens file picker when dropzone is clicked', async () => {
    renderFileUpload();
    const fileInput = screen.getByLabelText('Upload files');
    const dropzone = screen.getByLabelText('File uploader');
    jest.spyOn(fileInput, 'click');

    await userEvent.click(dropzone);

    expect(fileInput.click).toHaveBeenCalled();
  });

  test('opens file picker when Enter is pressed on dropzone', async () => {
    renderFileUpload();
    const fileInput = screen.getByLabelText('Upload files');
    const dropzone = screen.getByLabelText('File uploader');
    jest.spyOn(fileInput, 'click');

    dropzone.focus();
    expect(fileInput.click).toHaveBeenCalledTimes(0);
    await userEvent.keyboard('{Enter}');
    expect(fileInput.click).toHaveBeenCalledTimes(1);
  });
  test('opens file picker when Space is pressed on dropzone', async () => {
    renderFileUpload();
    const fileInput = screen.getByLabelText('Upload files');
    const dropzone = screen.getByLabelText('File uploader');
    jest.spyOn(fileInput, 'click');

    dropzone.focus();
    expect(fileInput.click).toHaveBeenCalledTimes(0);
    await userEvent.keyboard(' ');
    expect(fileInput.click).toHaveBeenCalledTimes(1);
  });
  test('opens file picker automatically when triggerOnMount is true', async () => {
    renderFileUpload({ triggerOnMount: true });

    const fileInput = screen.getByLabelText('Upload files');
    jest.spyOn(fileInput, 'click');

    await waitFor(() => expect(fileInput.click).toHaveBeenCalled());
  });

  test('does NOT open file picker when triggerOnMount is false', () => {
    renderFileUpload({ triggerOnMount: false });

    const fileInput = screen.getByLabelText('Upload files');
    jest.spyOn(fileInput, 'click');

    expect(fileInput.click).not.toHaveBeenCalled();
  });
  test('clicking "Change files" opens the file picker', async () => {
    renderFileUpload();
    const fileInput = screen.getByLabelText('Upload files');
    jest.spyOn(fileInput, 'click');

    fireEvent.change(fileInput, { target: { files: [mockFile] } });
    await screen.findByText('test-file.txt');

    const changeFilesButton = screen.getByRole('button', { name: 'Change files' });
    await userEvent.click(changeFilesButton);

    expect(fileInput.click).toHaveBeenCalled();
  });
  test('clears selected files when "Cancel upload" is clicked', async () => {
    renderFileUpload();
    const fileInput = screen.getByLabelText('Upload files');

    fireEvent.change(fileInput, { target: { files: [mockFile] } });
    await screen.findByText('test-file.txt');

    const cancelButton = screen.getByRole('button', { name: 'Cancel upload' });
    await userEvent.click(cancelButton);

    expect(screen.queryByText('test-file.txt')).not.toBeInTheDocument();
  });
  test('does not crash if onCancel is not provided', async () => {
    renderFileUpload();

    const fileInput = screen.getByLabelText('Upload files');
    fireEvent.change(fileInput, { target: { files: [mockFile] } });
    await screen.findByText('test-file.txt');

    const cancelButton = screen.getByRole('button', { name: 'Cancel upload' });
    await userEvent.click(cancelButton);

    expect(screen.queryByText('test-file.txt')).not.toBeInTheDocument();
  });

  test('calls onCancel when "Cancel upload" is clicked, if provided', async () => {
    const mockOnCancel = jest.fn();
    renderFileUpload({ onCancel: mockOnCancel });

    const fileInput = screen.getByLabelText('Upload files');

    fireEvent.change(fileInput, { target: { files: [mockFile] } });
    await screen.findByText('test-file.txt');

    const cancelButton = screen.getByRole('button', { name: 'Cancel upload' });
    await userEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalled();
  });
});
