import React, { Component } from "react";
import { AutoSizer } from "react-virtualized";
import EditableGrid from "./EditableGrid";
import InputEditor from "./InputEditor";
import AutocompleteEditor from "./AutocompleteEditor";
import "./App.css";

let _data = [
  { name: "code", type: "integer", required: true },
  { name: "title", type: "text", required: false }
];

let data = [];

for (let i = 0; i < 10; i++) {
  data = [...data, ..._data];
}

let newRowTemplateFunc = () => ({ name: "", type: "", required: false });

let columns = [
  {
    id: "Jo",
    renderView: props => `Hello ${props.row}`
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

function renderInput(
  {
    value,
    onSaveChange,
    onCancelChange
  }
) {
  return (
    <InputEditor
      initialValue={value}
      onSaveChange={onSaveChange}
      onCancelChange={onCancelChange}
    />
  );
}

function renderAutocomplete({ value, onSaveChange, onCancelChange }) {
  return (
    <AutocompleteEditor
      options={[
        { id: "text", title: "text" },
        { id: "integer", title: "integer" }
      ]}
      initialValue={value}
      onSaveChange={onSaveChange}
      onCancelChange={onCancelChange}
    />
  );
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
            {({ width, height }) => {
              return (
                <EditableGrid
                  ref={ref => {
                    this._grid = ref;
                  }}
                  columns={columns}
                  newRowTemplateFunc={newRowTemplateFunc}
                  data={data}
                  fixedColumnCount={2}
                  headerRowCount={1}
                  height={height}
                  width={width}
                />
              );
            }}
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
