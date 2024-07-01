import React from 'react';
import PropTypes from 'prop-types';
import { IconRebuild } from './icons';

function CreateScanLink(props) {
  const {
    children, className, handleClick, handlerParams,
  } = props;
  function localHandleClick(event) {
    event.preventDefault();
    const args = Object.keys(handlerParams).map(key => handlerParams[key]);
    handleClick(...args);
  }
  return (
    <button
      type="button"
      onClick={localHandleClick}
      className={className}
    >
      <IconRebuild />
      {children}
    </button>
  );
}

CreateScanLink.propTypes = {
  // Handler params object is intentionally ambiguous to allow the parent
  // component to specify params for the handleClick function
  // eslint-disable-next-line react/forbid-prop-types
  handlerParams: PropTypes.object,
  handleClick: PropTypes.func.isRequired,
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

CreateScanLink.defaultProps = {
  handlerParams: {},
  className: 'usa-button',
};

export default CreateScanLink;
