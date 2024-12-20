import React from 'react';
import PropTypes from 'prop-types';

function UsaIcon({ role = 'img', name, size = null }) {
  return (
    <svg
      className={size ? `usa-icon usa-icon--size-${size}` : 'usa-icon'}
      focusable={role === 'button' || role === 'link'}
      role={role}
    >
      <use href={`/img/sprite.svg#${name}`} />
    </svg>
  );
}

UsaIcon.propTypes = {
  role: PropTypes.oneOf(['img', 'presentation', 'button', 'link', 'status', 'none']),
  name: PropTypes.string.isRequired,
  size: PropTypes.oneOf([3, 4, 5, 6, 7, 8, 9]),
};

export default UsaIcon;
