import React from 'react';
import PropTypes from 'prop-types';

export default function PagingButtons({ currentPage, lastPage, setCurrentPage }) {
  const shouldDisableNextPage = currentPage === lastPage;
  const shouldDisablePreviousPage = currentPage === 0;
  const shouldShowButtons = !(lastPage !== null && lastPage === 0);

  function previousPage() {
    setCurrentPage(currentPage - 1);
  }

  function nextPage() {
    setCurrentPage(currentPage + 1);
  }

  const pbClassName = shouldDisablePreviousPage ? 'usa-button-disabled' : 'usa-button';
  const prevButtonClass = pbClassName;
  const nbClassName = shouldDisableNextPage ? 'usa-button-disabled' : 'usa-button';
  const nextButtonClass = `pull-right ${nbClassName}`;

  if (!shouldShowButtons) {
    return null;
  }

  return (
    <nav className="pagination" aria-label="Pagination">
      <button
        className={prevButtonClass}
        disabled={shouldDisablePreviousPage}
        onClick={previousPage}
        title="View the previous page of published files"
        type="button"
      >
        &laquo; Previous
      </button>

      <button
        className={nextButtonClass}
        disabled={shouldDisableNextPage}
        onClick={nextPage}
        title="View the next page of published files"
        type="button"
      >
        Next &raquo;
      </button>
    </nav>
  );
}

PagingButtons.propTypes = {
  currentPage: PropTypes.number,
  lastPage: PropTypes.number,
  setCurrentPage: PropTypes.func,
};
