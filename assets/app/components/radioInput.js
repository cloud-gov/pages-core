import React from 'react';

const propTypes = {
  id: React.PropTypes.string,
  name: React.PropTypes.string,
  value: React.PropTypes.bool,
  checked: React.PropTypes.bool,
  labelText: React.PropTypes.string,
  handleChange: React.PropTypes.func
};

class RadioInput extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      selected: false
    };

    this.onChange = this.onChange.bind(this);
  }

  onChange(event) {
    const { props } = this;

    props.handleChange({
      target: {
        name: props.name,
        value: props.value
      }
    });
  }

  render() {
    const { props } = this;

    return (
      <div className="radio" onClick={this.onChange}>
        <input
          readOnly={true}
          type="radio"
          id={props.id}
          name={props.name}
          checked={props.checked}
          value={props.value} />
        <label for={props.id}>
          {props.labelText}
        </label>
      </div>
    );
  }
}

RadioInput.propTypes = propTypes;


class RadioGroup extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      checked: ''
    }
  }

  render() {

  }
}

export default RadioInput;
