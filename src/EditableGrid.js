import React from "react";
import { fromJS } from "immutable";
import EditableGridBase from "./EditableGridBase";

const STYLE = {
  border: "2px solid #ddd"
};

export default class EditableGrid extends React.Component {
  static defaultProps = {
    rowHeight: 25
  };

  constructor(props) {
    super(props);
    this.state = {
      data: fromJS(props.data)
    };
    this.ids = props.columns.map(({ id }) => id);

    this._grid = null; // we need this to focus properly
  }

  cellRenderer = cellProps => {
    let { data } = this.state;
    let { columns } = this.props;
    let { row, column, isEditing, initialValue, onChange } = cellProps;
    let rowObj = data.get(row);
    if (rowObj === undefined) {
      return <span>&nbsp;</span>;
    }

    let id = this.ids[column];
    let value = rowObj.get(id);
    let editValue = initialValue || value;
    let { renderView, renderEdit } = columns[column];

    if (isEditing && renderEdit) {
      onChange(editValue);
      return renderEdit({ ...cellProps, value: editValue });
    } else {
      return renderView({ ...cellProps, value });
    }
  };

  isCellEditable = (row, column) => {
    let ret = true;
    let { columns } = this.props;
    let { renderEdit } = columns[column];
    if (renderEdit === undefined) {
      ret = false;
    }
    return ret;
  };

  onCellValueChange = (row, column, value) => {
    let { data } = this.state;
    let rowObj = data.get(row);
    let id = this.ids[column];
    this.setState({
      ...this.state,
      data: data.set(row, rowObj.set(id, value))
    });
  };

  render() {
    // TODO: data from state
    let { columns, data, style = {}, ...props } = this.props;
    return (
      <EditableGridBase
        {...props}
        ref={ref => {
          this._grid = ref;
        }}
        style={{ ...STYLE, ...style }}
        columnCount={columns.length}
        rowCount={data.length}
        cellRenderer={this.cellRenderer}
        isCellEditable={this.isCellEditable}
        onCellValueChange={this.onCellValueChange}
      />
    );
  }

  focus() {
    this._grid.focus();
  }
}
