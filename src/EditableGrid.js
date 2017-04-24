import React from "react";
import { fromJS } from "immutable";
import EditableGridBase from "./EditableGridBase";

const STYLE = {
  border: "2px solid #ddd"
};

function renderHeaderDefault(cellProps) {
  let { columnObj } = cellProps;
  return (
    <div style={{ fontWeight: "bold", textAlign: "center" }}>
      {columnObj.id}
    </div>
  );
}

export default class EditableGrid extends React.Component {
  static defaultProps = {
    rowHeight: 25,
    headerRowCount: 1
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
    let { headerRowCount, columns } = this.props;
    let { row, column, isEditing, initialValue, onChange } = cellProps;

    if (row < headerRowCount) {
      let columnObj = columns[column];
      let renderHeader = columnObj.renderHeader || renderHeaderDefault;
      return renderHeader({
        ...cellProps,
        columnObj
      });
    } else {
      // render value
      let rowObj = data.get(row - headerRowCount);
      if (rowObj === undefined) {
        return <div style={{}} key={`${row}-${column}`}>&nbsp;</div>;
      }

      let id = this.ids[column];
      let value = rowObj.get(id);
      let editValue = initialValue || value;
      let { renderView, renderEdit } = columns[column];

      if (isEditing && renderEdit) {
        return renderEdit({ ...cellProps, value: editValue });
      } else {
        return renderView({ ...cellProps, value });
      }
    }
  };

  isCellEditable = (row, column) => {
    let { headerRowCount, columns } = this.props;
    return row >= headerRowCount && columns[column].renderEdit !== undefined;
  };

  onCellValueChange = (row, column, value) => {
    let { headerRowCount } = this.props;
    let { data } = this.state;
    row -= headerRowCount;
    let rowObj = data.get(row);
    let id = this.ids[column];
    this.setState({
      ...this.state,
      data: data.set(row, rowObj.set(id, value))
    });
  };

  render() {
    let {
      headerRowCount,
      columns,
      data: initialData,
      style = {},
      ...props
    } = this.props;
    let { data } = this.state;
    let rowCount = (data ? data.size : initialData.length) + headerRowCount;
    return (
      <EditableGridBase
        {...props}
        ref={ref => {
          this._grid = ref;
        }}
        style={{ ...STYLE, ...style }}
        fixedRowCount={headerRowCount}
        columnCount={columns.length}
        rowCount={rowCount}
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
