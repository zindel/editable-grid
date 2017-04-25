import React from "react";

export default class InputEditor extends React.Component {
  constructor(props) {
    super(props);
    this.state = { value: props.initialValue };
  }

  onBlur = () => {
    let { onSaveChange } = this.props;
    onSaveChange && onSaveChange(this.state.value);
  };

  onKeyDown = e => {
    let { onSaveChange, onCancelChange } = this.props;
    if (e.key === "Enter") {
      onSaveChange && onSaveChange(this.state.value);
    } else if (e.key === "Escape") {
      this.setState(
        { value: undefined },
        () => onCancelChange && onCancelChange()
      );
    }
  };

  render() {
    return (
      <input
        ref="input"
        type="text"
        style={{
          border: "none",
          height: "100%",
          width: "100%",
          outline: "none"
        }}
        value={this.state.value}
        onChange={e => this.setState({ value: e.target.value })}
        onBlur={this.onBlur}
        onKeyDown={this.onKeyDown}
      />
    );
  }

  componentDidMount() {
    setTimeout(() => {
      this.refs.input.value = this.state.value;
      this.refs.input.focus();
    });
  }
}
