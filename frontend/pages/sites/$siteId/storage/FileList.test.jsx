import React from 'react';
import { act, render, screen, within, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import FileList from './FileList.jsx';

const mockFiles = [
  {
    id: '20',
    name: 'Documents',
    key: '~assets/Documents',
    type: 'directory',
    updatedAt: '2024-02-10T12:30:00Z',
  },
  {
    id: '21',
    name: 'report.pdf',
    key: '~assets/report.pdf',
    type: 'application/pdf',
    updatedAt: '2025-01-09T15:45:00Z',
    updatedBy: 'user@federal.gov',
    size: 23456,
  },
  {
    id: '22',
    name: 'presentation.ppt',
    key: '~assets/presentation.ppt',
    type: 'application/vnd.ms-powerpoint',
    updatedAt: '2024-02-08T09:15:00Z',
    updatedBy: 'user@federal.gov',
    size: 23456,
  },
];

const mockProps = {
  siteId: '1',
  path: '/',
  baseUrl: 'https://custom.domain.gov',
  data: mockFiles,
  onDelete: jest.fn(),
  onNavigate: jest.fn(),
  onSort: jest.fn(),
  currentSortKey: 'name',
  currentSortOrder: 'asc',
};

const FileListComponent = (props) => (
  <MemoryRouter>
    <FileList {...props} />
  </MemoryRouter>
);

describe('FileList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly with file and folder names', () => {
    render(<FileListComponent {...mockProps} />);
    expect(screen.getByRole('link', { name: 'Documents' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'report.pdf' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'presentation.ppt' })).toBeInTheDocument();
  });

  it('calls onNavigate when a folder is clicked', () => {
    render(<FileListComponent {...mockProps} />);
    fireEvent.click(screen.getByRole('link', { name: 'Documents' }));
    expect(mockProps.onNavigate).toHaveBeenCalledWith('/Documents/');
  });

  it('does not trigger onNavigate when clicking a file', () => {
    render(<FileListComponent {...mockProps} />);
    fireEvent.click(screen.getByRole('link', { name: 'report.pdf' }));
    expect(mockProps.onNavigate).not.toHaveBeenCalled();
  });

  it('calls onViewDetails when a file name is clicked', () => {
    const { id, name } = mockFiles[1];
    const href = `/sites/${mockProps.siteId}/storage/files/${id}`;

    render(<FileListComponent {...mockProps} />);

    const link = screen.getByRole('link', { name });

    expect(link).toHaveAttribute('href', href);
  });

  it('calls onSort and reverses sort when a sortable header is clicked', () => {
    render(<FileListComponent {...mockProps} />);

    fireEvent.click(screen.getByLabelText('Sort by name'));
    expect(mockProps.onSort).toHaveBeenCalledWith('name');
    expect(screen.getByRole('columnheader', { name: /name/i })).toHaveAttribute(
      'aria-sort',
      'ascending',
    );
  });

  it('calls onSort with updatedAt for last modified header', () => {
    render(<FileListComponent {...mockProps} />);

    const sortButton = screen.getByLabelText('Sort by last modified');
    fireEvent.click(sortButton);

    expect(mockProps.onSort).toHaveBeenCalledWith('updatedAt');
  });

  it('shows the ascending icon if currentSortOrder is asc', () => {
    render(<FileListComponent {...mockProps} />);
    const sortButton = screen.getByLabelText('Sort by name');
    const ascendingIcon = within(sortButton).getByLabelText('ascending sort icon');
    expect(ascendingIcon).toBeInTheDocument();
  });

  it('shows the descending icon if currentSortOrder is desc', () => {
    render(<FileListComponent {...mockProps} currentSortOrder="desc" />);
    const sortButton = screen.getByLabelText('Sort by name');
    const descendingIcon = within(sortButton).getByLabelText('descending sort icon');
    expect(descendingIcon).toBeInTheDocument();
  });

  it('shows the unsorted icon on headers that are not currently sorted', () => {
    render(<FileListComponent {...mockProps} />);
    const sortButton = screen.getByLabelText('Sort by last modified');
    const unsortedIcon = within(sortButton).getByLabelText('unsorted icon');
    expect(unsortedIcon).toBeInTheDocument();
  });

  it('calls onSort with name for file name header', () => {
    render(<FileListComponent {...mockProps} />);

    const sortButton = screen.getByLabelText('Sort by name');
    fireEvent.click(sortButton);

    expect(mockProps.onSort).toHaveBeenCalledWith('name');
  });

  it('calls onDelete when a folder delete button is clicked', () => {
    render(<FileListComponent {...mockProps} />);
    fireEvent.click(screen.getAllByRole('button', { name: 'Delete' })[0]);
    expect(mockProps.onDelete).toHaveBeenCalledWith({
      ...mockFiles[0],
      type: 'directory',
    });
  });

  it('calls onDelete when a file delete button is clicked', () => {
    render(<FileListComponent {...mockProps} />);
    fireEvent.click(screen.getAllByRole('button', { name: 'Delete' })[1]);
    expect(mockProps.onDelete).toHaveBeenCalledWith({ ...mockFiles[1] });
  });

  it('renders no rows when no files are present', () => {
    render(<FileListComponent {...mockProps} data={[]} />);
    expect(screen.getAllByRole('row').length).toBe(1);
  });

  it('copies file link to clipboard when copy button is clicked', async () => {
    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn().mockResolvedValue(),
      },
    });

    jest.useFakeTimers();

    render(<FileListComponent {...mockProps} />);

    const copyButton = screen.getAllByText('Copy link')[0];

    fireEvent.click(copyButton);

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      'https://custom.domain.gov/~assets/report.pdf',
    );

    await screen.findByText('Copied!');
    act(() => jest.advanceTimersByTime(5000));
    await waitFor(() => expect(screen.queryByText('Copied!')).not.toBeInTheDocument());
    expect(screen.getAllByText('Copy link')).toHaveLength(2);

    jest.useRealTimers();
  });

  it('renders children if provided', () => {
    render(
      <FileListComponent {...mockProps}>
        <tr data-testid="child-row">
          <td>Child Row</td>
        </tr>
      </FileListComponent>,
    );
    expect(screen.getByTestId('child-row')).toBeInTheDocument();
  });

  it('applies the highlight class when highlightItem matches the row name', () => {
    const highlightProps = { ...mockProps, highlightItem: 'report.pdf' };
    render(<FileListComponent {...highlightProps} />);

    const cell = screen.getByText('report.pdf');
    // eslint-disable-next-line testing-library/no-node-access
    const row = cell.closest('tr');
    expect(row).toHaveClass('highlight');
  });
});
