import React, { act } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import FileList from './FileList.jsx';

const mockFiles = [
  { name: 'Documents', type: 'folder', lastModified: '2024-02-10T12:30:00Z' },
  {
    name: 'report.pdf',
    type: 'file',
    lastModified: '2024-02-09T15:45:00Z',
    url: 'https://custom.domain.gov/~assets/report.pdf',
  },
  {
    name: 'presentation.pptx',
    type: 'file',
    lastModified: '2024-02-08T09:15:00Z',
    url: 'https://custom.domain.gov/~assets/presentation.pptx',
  },
];

const mockProps = {
  path: '',
  data: mockFiles,
  onDelete: jest.fn(),
  onNavigate: jest.fn(),
  onViewDetails: jest.fn(),
  onSort: jest.fn(),
  currentSortKey: 'name',
  currentSortOrder: 'asc',
};

describe('FileList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly with file and folder names', () => {
    render(
      <MemoryRouter>
        <FileList {...mockProps} />
      </MemoryRouter>,
    );
    expect(screen.getByRole('link', { name: 'Documents' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'report.pdf' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'presentation.pptx' })).toBeInTheDocument();
  });

  it('does not trigger onViewDetails when clicking a folder', () => {
    render(
      <MemoryRouter>
        <FileList {...mockProps} />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByRole('link', { name: 'Documents' }));
    expect(mockProps.onViewDetails).not.toHaveBeenCalled();
  });

  it('calls onNavigate when a folder is clicked', () => {
    render(
      <MemoryRouter>
        <FileList {...mockProps} />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByRole('link', { name: 'Documents' }));
    expect(mockProps.onNavigate).toHaveBeenCalledWith('/Documents');
  });

  it('does not trigger onNavigate when clicking a file', () => {
    render(
      <MemoryRouter>
        <FileList {...mockProps} />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByRole('link', { name: 'report.pdf' }));
    expect(mockProps.onNavigate).not.toHaveBeenCalled();
  });

  it('calls onViewDetails when a file name is clicked', () => {
    render(
      <MemoryRouter>
        <FileList {...mockProps} />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByRole('link', { name: 'report.pdf' }));
    expect(mockProps.onViewDetails).toHaveBeenCalledWith('report.pdf');
  });

  it('calls onSort and updates the sort dir when a sortable header is clicked', () => {
    render(
      <MemoryRouter>
        <FileList {...mockProps} />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByLabelText('Sort by name'));
    expect(mockProps.onSort).toHaveBeenCalledWith('name');
    expect(screen.getByRole('columnheader', { name: /name/i })).toHaveAttribute(
      'aria-sort',
      'ascending',
    );
  });

  it('calls onDelete when a file delete button is clicked', () => {
    render(
      <MemoryRouter>
        <FileList {...mockProps} />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getAllByRole('button', { name: 'Delete' })[0]);
    expect(mockProps.onDelete).toHaveBeenCalledWith(mockFiles[0]);
  });

  it('renders empty state message when no files are present', () => {
    render(
      <MemoryRouter>
        <FileList {...mockProps} data={[]} />
      </MemoryRouter>,
    );
    expect(screen.getByText('No files or folders found.')).toBeInTheDocument();
  });

  it('copies file link to clipboard when copy button is clicked', async () => {
    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn().mockResolvedValue(),
      },
    });

    render(
      <MemoryRouter>
        <FileList {...mockProps} />
      </MemoryRouter>,
    );

    const copyButton = screen.getAllByText('Copy link')[0];

    await act(async () => {
      fireEvent.click(copyButton);
    });

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      'https://custom.domain.gov/~assets/report.pdf',
    );
  });
});
