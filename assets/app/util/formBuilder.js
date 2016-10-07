import React from 'react';

const SELECT_TYPE = 'select';
const INPUT_TYPE = 'input';

const Select = (props, options) => {
  const setOptions = (options = []) => {
    return options.map((option, index) => {
      return <option value={option} key={index}>{option}</option>;
    });
  };

  return (
    <select { ...props }>
      { setOptions(options) }
    </select>
  );
};

const Input = (props) => {
  return <input { ...props } />;
};

const getDefaultProps = (props) => {
  const {
    handler: handler = () => {},
    ...rest
  } = props;

  const onChange = (event) => {
    const { name, value } = event.target;
    const nextState = {};
    nextState[name] = value;

    handler(nextState);
  };

  return { onChange, ...rest }
};

const build = (formFieldDescriptor) => {
  const fieldType = formFieldDescriptor.field;
  const { props: raw } = formFieldDescriptor;
  const props = getDefaultProps(raw);

  switch(fieldType) {
    case SELECT_TYPE:
      const { options, ...rest } = props
      return Select(rest, options);
    case INPUT_TYPE:
      return Input(props);
  }
};

export default build;
