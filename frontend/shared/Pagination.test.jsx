import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Pagination from './Pagination';

const mockOnPageChange = jest.fn();

const defaultProps = {
  currentPage: 1,
  totalPages: 12,
  totalItems: 111,
  itemsOnCurrentPage: 10,
  onPageChange: mockOnPageChange,
};

const renderPagination = (props = {}) => {
  return render(<Pagination {...defaultProps} {...props} />);
};

describe('Pagination Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders pagination label correctly', () => {
    renderPagination();
    expect(screen.getByText(/Showing 10 of 111 total/i)).toBeInTheDocument();
  });

  test('displays Previous button disabled on first page', () => {
    renderPagination();
    expect(screen.getByLabelText(/Previous page/i)).toBeDisabled();
  });

  test('displays Next button disabled on last page', () => {
    renderPagination({ currentPage: defaultProps.totalPages });
    expect(screen.getByLabelText(/Next page/i)).toBeDisabled();
  });

  test('calls onPageChange when clicking Next button', () => {
    renderPagination();
    fireEvent.click(screen.getByLabelText(/Next page/i));
    expect(mockOnPageChange).toHaveBeenCalledWith(2);
  });

  test('calls onPageChange when clicking Previous button', () => {
    renderPagination({ currentPage: 2 });
    fireEvent.click(screen.getByLabelText(/Previous page/i));
    expect(mockOnPageChange).toHaveBeenCalledWith(1);
  });

  test('calls onPageChange when clicking a numbered page', () => {
    renderPagination({ currentPage: 5 });
    fireEvent.click(screen.getByText('4'));
    expect(mockOnPageChange).toHaveBeenCalledWith(4);
  });

  test('highlights the current page', () => {
    renderPagination({ currentPage: 3 });
    const currentPageElement = screen.getByRole('button', { current: 'page' });
    expect(currentPageElement).toHaveTextContent('3');
  });

  test('clicking current page does not trigger onPageChange', () => {
    renderPagination({ currentPage: 4 });
    fireEvent.click(screen.getByText('4'));
    expect(mockOnPageChange).not.toHaveBeenCalled();
  });

  test('displays full range of pages if total pages is 5 or fewer', () => {
    renderPagination({ totalPages: 4, totalItems: 50 });
    // eslint-disable-next-line no-plusplus
    for (let i = 1; i <= 4; i++) {
      expect(screen.getByText(i.toString())).toBeInTheDocument();
    }
    expect(screen.queryByText('…')).not.toBeInTheDocument();
  });

  test('hides pagination controls if only one page exists', () => {
    renderPagination({ totalPages: 1, totalItems: 10 });
    expect(
      screen.queryByRole('navigation', { name: 'Pagination' }),
    ).not.toBeInTheDocument();
  });

  test('displays ellipsis for later pages when early in the pages', () => {
    renderPagination({ currentPage: 2 });
    expect(screen.getByText('…')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
  });

  test('displays ellipsis for earlier pages when near the end of pages', () => {
    renderPagination({ currentPage: 9 });
    expect(screen.getByText('…')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  test('displays both ellipsis when near the center of pages', () => {
    renderPagination({ currentPage: 5 });
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getAllByText('…')).toHaveLength(2); // Two ellipses
  });

  test('ellipsis elements are not interactive', () => {
    renderPagination({ currentPage: 6 });
    const ellipses = screen.getAllByText('…');
    ellipses.forEach((ellipsis) => {
      expect(ellipsis).not.toHaveAttribute('role');
      expect(ellipsis).not.toHaveAttribute('tabindex');
    });
  });
});
