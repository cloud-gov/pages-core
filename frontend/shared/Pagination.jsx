import React from 'react';
import PropTypes from 'prop-types';

const MAX_VISIBLE_PAGES = 5;
// Minimum distance from start/end before showing ellipsis
const ELLIPSIS_THRESHOLD = Math.floor(MAX_VISIBLE_PAGES / 2) + 1;

const Pagination = ({
  currentPage,
  totalPages,
  totalItems,
  itemsOnCurrentPage,
  onPageChange,
}) => {
  const getPageNumbers = () => {
    const pageNumbers = [];

    if (totalPages <= MAX_VISIBLE_PAGES) {
      return Array.from({ length: totalPages }, (_, i) => ({
        type: i + 1 === currentPage ? 'current' : 'page',
        page: i + 1,
      }));
    }

    pageNumbers.push({ type: currentPage === 1 ? 'current' : 'page', page: 1 });

    if (currentPage > ELLIPSIS_THRESHOLD) {
      pageNumbers.push({ type: 'ellipsis' });
    }

    let startPage = Math.max(2, currentPage - 1);
    let endPage = Math.min(totalPages - 1, currentPage + 1);

    for (let i = startPage; i <= endPage; i += 1) {
      pageNumbers.push({ type: i === currentPage ? 'current' : 'page', page: i });
    }

    if (currentPage < totalPages - ELLIPSIS_THRESHOLD) {
      pageNumbers.push({ type: 'ellipsis' });
    }

    pageNumbers.push({
      type: currentPage === totalPages ? 'current' : 'page',
      page: totalPages,
    });

    return pageNumbers;
  };

  if (totalPages < 1) {
    return null;
  }

  return (
    <div className="pagination bg-base-lightest padding-1">
      <p
        className="
      pagination__label text-center margin-top-1 margin-bottom-3 margin-x-auto text-base
      "
      >
        Showing {itemsOnCurrentPage} of {totalItems} total
      </p>
      {totalPages > 1 && (
        <nav className="usa-pagination bg-base-lightest" aria-label="Pagination">
          <ul className="usa-pagination__list">
            <PaginationButton
              page={currentPage - 1}
              label="Previous page"
              type="link"
              customClass="usa-pagination__previous-page"
              isDisabled={currentPage === 1}
              onClick={onPageChange}
            >
              <svg className="usa-icon" aria-hidden="true" role="img">
                <use href="/img/sprite.svg#navigate_before"></use>
              </svg>
              Previous
            </PaginationButton>

            {getPageNumbers().map((item, index) =>
              item.type === 'ellipsis' ? (
                <li
                  key={`ellipsis-${currentPage}-${index}`}
                  className="usa-pagination__item usa-pagination__overflow"
                  aria-label="ellipsis indicating non-visible pages"
                >
                  <span>&hellip;</span>
                </li>
              ) : (
                <PaginationButton
                  key={item.page}
                  page={item.page}
                  label={item.page.toString()}
                  isCurrent={item.type === 'current'}
                  customClass={
                    item.type === 'current' ? 'usa-current text-no-underline' : undefined
                  }
                  onClick={onPageChange}
                />
              ),
            )}
            <PaginationButton
              page={currentPage + 1}
              label="Next page"
              type="link"
              customClass="usa-pagination__next-page"
              isDisabled={currentPage === totalPages}
              onClick={onPageChange}
            >
              Next
              <svg className="usa-icon" aria-hidden="true" role="img">
                <use href="/img/sprite.svg#navigate_next"></use>
              </svg>
            </PaginationButton>
          </ul>
        </nav>
      )}
    </div>
  );
};

const PaginationButton = ({
  page,
  label,
  children,
  type = 'button',
  isCurrent = false,
  isDisabled = false,
  customClass = undefined,
  onClick,
}) => (
  <li className="usa-pagination__item">
    <button
      type="button"
      className={`text-bold usa-button--unstyled usa-pagination__${type} ${
        customClass || 'bg-white hover:bg-primary-lightest'
      }`}
      onClick={!isDisabled && !isCurrent ? () => onClick(page) : undefined}
      aria-label={label}
      aria-current={isCurrent ? 'page' : undefined}
      disabled={isDisabled}
      style={!isDisabled && !isCurrent ? { cursor: 'pointer' } : {}}
      title={`Navigate to ${type === 'button' ? 'page ' : ''}${label}`}
    >
      {children || label}
    </button>
  </li>
);

PaginationButton.propTypes = {
  page: PropTypes.number.isRequired,
  label: PropTypes.string.isRequired,
  children: PropTypes.node,
  type: PropTypes.string,
  isCurrent: PropTypes.bool,
  isDisabled: PropTypes.bool,
  customClass: PropTypes.string,
  onClick: PropTypes.func.isRequired,
};

Pagination.propTypes = {
  currentPage: PropTypes.number.isRequired,
  totalPages: PropTypes.number.isRequired,
  totalItems: PropTypes.number.isRequired,
  itemsOnCurrentPage: PropTypes.number.isRequired,
  onPageChange: PropTypes.func.isRequired,
};

export default Pagination;
