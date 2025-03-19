import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';

const Dialog = ({
  header = 'Are you sure you want to continue?',
  message = 'You have unsaved changes that will be lost.',
  primaryButton = 'Continue without saving',
  secondaryButton = null,
  primaryHandler,
  secondaryHandler = () => {},
  closeHandler = () => {},
  children = null,
  dismissable = true,
  open = false,
}) => {
  const dialogRef = useRef(null);
  const firstFocusableRef = useRef(null);
  const lastFocusedElementRef = useRef(null);
  // focus trap for better a11y
  useEffect(() => {
    if (open) {
      lastFocusedElementRef.current = document.activeElement;
      dialogRef.current?.focus();

      const focusableElements = dialogRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );

      if (focusableElements.length > 0) {
        firstFocusableRef.current = focusableElements[0];
        firstFocusableRef.current.focus();
      }
    } else {
      setTimeout(() => {
        lastFocusedElementRef.current?.focus();
      }, 10);
    }
  }, [open]);

  // eslint-disable-next-line sonarjs/cognitive-complexity
  const handleKeyDown = (e) => {
    if (e.key === 'Escape' && dismissable) {
      closeHandler();
    }

    if (e.key === 'Tab') {
      e.preventDefault(); // Prevent native tab behavior

      const focusableElements = dialogRef.current?.querySelectorAll(
        // eslint-disable-next-line max-len
        'button, [href]:not(use), input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );

      // Convert to array & ignore the SVG icon from USWDS that also has href
      const focusableArray = Array.from(focusableElements).filter(
        (el) => el.tagName !== 'USE', // some browsers are weird about svgs
      );

      if (focusableArray.length === 0) return;

      const firstElement = focusableArray[0];
      const lastElement = focusableArray[focusableArray.length - 1];

      // Shift+Tab moves backward
      if (e.shiftKey && document.activeElement === firstElement) {
        lastElement.focus();
        return;
      }

      // Tab moves forward
      if (!e.shiftKey && document.activeElement === lastElement) {
        firstElement.focus();
        return;
      }

      // Find the currently focused element and move focus
      for (let i = 0; i < focusableArray.length; i += 1) {
        if (focusableArray[i] === document.activeElement) {
          const nextIndex = i + (e.shiftKey ? -1 : 1);
          focusableArray[nextIndex]?.focus();
          break; // Prevent further looping
        }
      }
    }
  };

  if (!open) return;
  return (
    <>
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
      <div
        className={`usa-modal-wrapper ${open ? 'is-visible' : ''}`}
        ref={dialogRef}
        role="dialog"
        aria-labelledby="modal-heading"
        aria-describedby="modal-description"
        onKeyDown={handleKeyDown}
        tabIndex={-1} // Allow focus
      >
        {' '}
        {/* eslint-disable-next-line max-len */}
        {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events */}
        <div
          data-testid="modal-overlay"
          className="usa-modal-overlay"
          onClick={(e) => {
            if (dismissable && e.target === e.currentTarget) {
              closeHandler();
            }
          }}
        ></div>
        <div className="usa-modal">
          <div className="usa-modal__content">
            <div className="usa-modal__main">
              <h2 className="usa-modal__heading" id="modal-heading">
                {header}
              </h2>
              {message && (
                <div className="usa-prose">
                  <p id="modal-description">{message}</p>
                </div>
              )}
              {children}
              <div className="usa-modal__footer">
                <ul className="usa-button-group">
                  {primaryButton && (
                    <li className="usa-button-group__item">
                      <button
                        tabIndex="0"
                        type="button"
                        className="usa-button"
                        data-close-modal
                        onClick={primaryHandler}
                      >
                        {primaryButton}
                      </button>
                    </li>
                  )}
                  {secondaryButton && secondaryHandler && (
                    <li className="usa-button-group__item">
                      <button
                        tabIndex="0"
                        type="button"
                        className="usa-button usa-button--unstyled padding-105"
                        data-close-modal
                        onClick={secondaryHandler}
                      >
                        {secondaryButton}
                      </button>
                    </li>
                  )}
                </ul>
              </div>
            </div>
            {dismissable && closeHandler && (
              <button
                tabIndex="0"
                type="button"
                className="usa-button usa-modal__close"
                aria-label="Close this window"
                data-close-modal
                onClick={closeHandler}
              >
                <svg className="usa-icon" aria-hidden="true" focusable="false" role="img">
                  <use href="/img/sprite.svg#close"></use>
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

Dialog.propTypes = {
  header: PropTypes.string,
  message: PropTypes.string,
  primaryButton: PropTypes.string,
  secondaryButton: PropTypes.string,
  primaryHandler: PropTypes.func.isRequired,
  secondaryHandler: PropTypes.func,
  closeHandler: PropTypes.func,
  children: PropTypes.node,
  dismissable: PropTypes.bool,
  open: PropTypes.bool,
};

export default Dialog;
