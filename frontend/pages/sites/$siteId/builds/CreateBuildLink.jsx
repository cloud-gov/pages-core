import React from 'react';
import PropTypes from 'prop-types';
import { IconRebuild } from '@shared/icons';

function CreateBuildLink(props) {
  const { children, className, handleClick, handlerParams } = props;
  function localHandleClick(event) {
    event.preventDefault();
    const args = Object.keys(handlerParams).map((key) => handlerParams[key]);
    handleClick(...args);
  }
  return (
    <button type="button" onClick={localHandleClick} className={className}>
      <IconRebuild />
      {children}
    </button>
  );
}

CreateBuildLink.propTypes = {
  // Handler params object is intentionally ambiguous to allow the parent
  // component to specify params for the handleClick function
  handlerParams: PropTypes.object,
  handleClick: PropTypes.func.isRequired,
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

CreateBuildLink.defaultProps = {
  handlerParams: {},
  className: 'usa-button',
};

export default CreateBuildLink;
