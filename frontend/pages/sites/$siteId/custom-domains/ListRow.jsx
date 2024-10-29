import React from 'react';
import PropTypes from 'prop-types';

export default function ListRow({ children, justify = 'flex-start', ...props }) {
  return (
    <div
      style={{
        alignItems: 'center',
        display: 'flex',
        justifyContent: justify,
        gap: '10px',
        width: '100%',
        ...props,
      }}
    >
      {children}
    </div>
  );
}

ListRow.propTypes = {
  children: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.node), PropTypes.node])
    .isRequired,
  justify: PropTypes.string,
};
