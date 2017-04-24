import React, { Component } from "react";
import ReactDOM from "react-dom";
import { AutoSizer } from "react-virtualized";
import EditableGrid from "./EditableGrid";
import Autocomplete from "@prometheusresearch/react-autocomplete";
import "./App.css";

/*
 *  TODO:
 *  1. Fetch JSON (+)
 *  2. Handle the keyboard event and focused cell (+)
 *  3. Render the own JSON in the example grid
 *  4. Render editor box
 *  5. Try the keyboard functionality (+)
 *
 *
 */

function renderSimple(props) {
  return !props.isEditing ? props.value + "" : renderInput(props);
}

let _data = [
  { name: "code", type: "integer", required: true },
  { name: "title", type: "text", required: false }
];

let data = [];

for (let i = 0; i < 10; i++) {
  data = [...data, ..._data];
}

let columns = [
  {
    id: "Jo",
    renderView: props => `Hello ${props.row}`
    // renderHeader: () => (
    //   <div
    //     style={{
    //       zIndex: "100",
    //       overflow: "visible",
    //       height: "60px",
    //       width: "90px",
    //       background: "red"
    //     }}
    //   >
    //     test<br />uou
    //   </div>
    // )
  },
  {
    id: "name",
    renderView: props => props.value,
    renderEdit: renderInput,
    width: 80
  },
  {
    id: "type",
    renderView: ({ value }) => value + "",
    renderEdit: renderAutocomplete,
    width: 150
  },
  {
    id: "required",
    renderView: ({ value }) => value + "",
    renderEdit: renderInput,
    width: 150
  }
];

function renderAutocomplete({ value, onSaveChange, onCancelChange }) {
  return (
    <AutocompleteEditor
      initialValue={value}
      onSaveChange={onSaveChange}
      onCancelChange={onCancelChange}
    />
  );
}
class AutocompleteEditor extends React.Component {
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
    return (
      <Autocomplete
        ref="input"
        searchTerm={
          initialValue && initialValue.length === 1 ? initialValue : ""
        }
        options={[
          { id: "text", title: "text" },
          { id: "integer", title: "integer" }
        ]}
        onChange={this.onChange}
        onKeyUp={this.onKeyUp}
      />
    );
  }

  componentDidMount() {
    setTimeout(() => {
      ReactDOM.findDOMNode(this.refs.input).children[0].focus();
    });
  }
}

function renderInput({ value, onSaveChange, onCancelChange }) {
  return (
    <Input
      initialValue={value}
      onSaveChange={onSaveChange}
      onCancelChange={onCancelChange}
    />
  );
}

class Input extends React.Component {
  constructor(props) {
    super(props);
    this.state = { value: props.initialValue };
  }

  onChange = e => {
    let { onChange } = this.props;
    let value = e.target.value;
    this.setState({ value }, () => onChange && onChange(value));
  };

  onBlur = () => {
    let { onSaveChange } = this.props;
    onSaveChange && onSaveChange(this.state.value);
  };

  onKeyUp = e => {
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
        onChange={this.onChange}
        onBlur={this.onBlur}
        onKeyUp={this.onKeyUp}
      />
    );
  }

  componentDidMount() {
    setTimeout(() => {
      this.refs.input.focus();
    });
  }
}

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      data: null
    };
  }

  componentDidMount() {
    setTimeout(() => {
      this._grid.focus();
    });
  }

  render() {
    return (
      <div className="App">
        <div className="Grid">
          <AutoSizer>
            {({ width, height }) => (
              <EditableGrid
                ref={ref => {
                  this._grid = ref;
                }}
                columns={columns}
                data={data}
                fixedColumnCount={2}
                headerRowCount={1}
                columnWidth={200}
                columnCount={50}
                height={300}
                rowCount={100}
                width={650}
              />
            )}
          </AutoSizer>
        </div>
        <div className="Input">
          <input type="text" />
        </div>
      </div>
    );
  }
}

export default App;
