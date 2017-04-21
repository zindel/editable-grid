import React, { Component } from "react";
import { AutoSizer } from "react-virtualized";
import EditableGrid from "./EditableGrid";
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

let data = [
  { name: "code", type: "integer", required: true },
  { name: "title", type: "text", required: false }
];

let columns = [
  {
    id: "-",
    renderView: props => "Hello"
  },
  {
    id: "name",
    renderView: props => props.value,
    renderEdit: renderInput,
    width: 80
  },
  {
    id: "type",
    renderView: renderSimple,
    renderEdit: renderInput,
    width: 150
  },
  {
    id: "required",
    renderView: renderSimple,
    renderEdit: renderInput,
    width: 150
  }
];

function renderInput({ value, onChange }) {
  return <Input initialValue={value} onChange={onChange} />;
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

  render() {
    return (
      <input
        ref="input"
        type="text"
        style={{ border: "none", height: "100%", width: "100%" }}
        value={this.state.value}
        onChange={this.onChange}
      />
    );
  }

  componentDidMount() {
    this.refs.input.focus();
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
        <AutoSizer>
          {({ width, height }) => (
            <EditableGrid
              ref={ref => {
                this._grid = ref;
              }}
              columns={columns}
              data={data}
              fixedColumnCount={1}
              fixedRowCount={0}
              columnWidth={75}
              columnCount={50}
              height={height}
              rowCount={100}
              width={width}
            />
          )}
        </AutoSizer>
      </div>
    );
  }
}

export default App;
