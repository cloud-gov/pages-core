import React from 'react';
import PropTypes from 'prop-types';

export const availableSourceCodePlatforms = [
  {
    label: 'GitHub',
    value: 'github',
  },
  {
    label: 'Workshop GitLab',
    value: 'gitlab',
  },
];

function makeOptions(opts) {
  return [
    <option key="" value="" disabled>
      Source code provider
    </option>,
    ...opts.map(({ label, value }) => (
      <option key={value} value={value}>
        {label}
      </option>
    )),
  ];
}

const SelectSourceCodePlatform = ({
                            value,
                            onChange,
                            name,
                            id,
                            className,
                            touched = false,
                            error,
                          }) => {
  return (
    <>
      {touched && error && <span className="usa-error-message">{error}</span>}
      <select
        className={`usa-select ${className}`}
        {...{ name, id }}
        value={value}
        onChange={onChange}
      >
        {makeOptions(availableSourceCodePlatforms)}
      </select>
    </>
  );
};

SelectSourceCodePlatform.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func,
  name: PropTypes.string.isRequired,
  id: PropTypes.string.isRequired,
  className: PropTypes.string,
  touched: PropTypes.bool,
  error: PropTypes.string,
};

export default SelectSourceCodePlatform;
