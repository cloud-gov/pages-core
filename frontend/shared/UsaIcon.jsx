import React from 'react';
import PropTypes from 'prop-types';

function UsaIcon({ focusable = false, role = 'img', name, size = null }) {
  return (
    <svg
      className={size ? `usa-icon usa-icon--size-${size}` : 'usa-icon'}
      aria-hidden="true"
      focusable={focusable}
      role={role}
    >
      <use xlinkHref={`/img/sprite.svg#${name}`} />
    </svg>
  );
}

UsaIcon.propTypes = {
  role: PropTypes.string,
  focusable: PropTypes.bool,
  name: PropTypes.string.isRequired,
  size: PropTypes.number,
};

UsaIcon.defaultProps = {
  role: 'img',
  focusable: false,
  size: null,
};

export default UsaIcon;
