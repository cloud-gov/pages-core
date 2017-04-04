import React from 'react';

const propTypes = {
  name: React.PropTypes.string.isRequired,
  value: React.PropTypes.bool,
  checked: React.PropTypes.bool,
  labelText: React.PropTypes.string,
  handleChange: React.PropTypes.func.isRequired
};

class RadioInput extends React.Component {
  constructor(props) {
    super(props);

    this.onChange = this.onChange.bind(this);
  }

  onChange(event) {
    const { props } = this;

    // the actual event occurs on the parent div, so we pass a fake 'event'
    // object with just the info we care about to the parent component
    props.handleChange({
      target: {
        name: props.name,
        value: props.value
      }
    });
  }

  render() {
    const { name, checked, labelText } = this.props;

    return (
      <div className="radio" onClick={this.onChange}>
        <input
          readOnly={true}
          type="radio"
          checked={checked}
          name={name} />
        <label htmlFor={name}>
          {labelText}
        </label>
      </div>
    );
  }
}

RadioInput.propTypes = propTypes;

export default RadioInput;
