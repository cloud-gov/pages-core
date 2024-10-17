import React from 'react';
import PropTypes from 'prop-types';

function CreateScanLink({
  children,
  className,
  isDisabled = false,
  handleClick,
}) {
  return (
    <button
      type="button"
      onClick={handleClick}
      className={className}
      disabled={isDisabled}
    >
      {children}
    </button>
  );
}

CreateScanLink.propTypes = {
  handleClick: PropTypes.func.isRequired,
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  isDisabled: PropTypes.bool,
};

CreateScanLink.defaultProps = {
  className: 'usa-button',
  isDisabled: false,
};

export default CreateScanLink;
