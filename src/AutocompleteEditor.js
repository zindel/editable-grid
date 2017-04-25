import React from "react";
import ReactDOM from "react-dom";
import Autocomplete from "@prometheusresearch/react-autocomplete";

export default class AutocompleteEditor extends React.Component {
  static defaultProps = {
    options: []
  };

  constructor(props) {
    super(props);
    this.state = { value: props.initialValue };
  }

  onKeyUp = e => {
    if (e.key === "Enter") {
      e.stopPropagation();
      e.preventDefault();
    } else if (e.key === "Escape") {
      this.props.onCancelChange();
    }
  };

  onChange = v => {
    if (v !== null && v !== undefined) {
      setTimeout(() => this.props.onSaveChange(v.id), 100);
    } else {
      // TODO: check if the current search term matches the option
      // if not cancel change
    }
  };

  render() {
    let { initialValue } = this.props;
    let { options } = this.props;
    return (
      <Autocomplete
        ref="input"
        searchTerm={
          initialValue && initialValue.length === 1 ? initialValue : ""
        }
        options={options}
        onChange={this.onChange}
        onKeyUp={this.onKeyUp}
      />
    );
  }

  componentDidMount() {
    setTimeout(() => {
      let input = ReactDOM.findDOMNode(this.refs.input).children[0];
      input.focus();
      input.value = input.value;
    });
  }
}
