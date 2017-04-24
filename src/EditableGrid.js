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
    headerRowCount: 1,
    newRowTemplateFunc: null,
    autoGrowMaxRows: null,
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
    let { row, column, isEditing, initialValue } = cellProps;

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
      // if (rowObj === undefined) {
      //   let key = `${row}-${column}`;
      //   return <div style={{}} key={key}>&nbsp;</div>;
      // }

      let id = this.ids[column];
      let value = rowObj === undefined ? "" : rowObj.get(id);
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
    let ret = row >= headerRowCount && columns[column].renderEdit !== undefined;
    return ret;
  };

  onCellValueChange = (row, column, value) => {
    let { headerRowCount, newRowTemplateFunc } = this.props;
    let { data } = this.state;
    row -= headerRowCount;
    let rowObj = data.get(row);
    let id = this.ids[column];

    // for now always insert new row to the end
    if (rowObj === undefined && data.size === row && newRowTemplateFunc) {
      rowObj = fromJS(newRowTemplateFunc());
      data = data.push(rowObj);
    }
    this.setState({
      ...this.state,
      data: data.set(row, rowObj.set(id, value))
    });
  };

  render() {
    let {
      newRowTemplateFunc,
      headerRowCount,
      columns,
      data: initialData,
      style = {},
      fixedColumnCount,
      autoGrowMaxRows,
      rowHeight,
      height,
      width
    } = this.props;
    let { data } = this.state;
    let rowCount = (data ? data.size : initialData.length) +
      headerRowCount +
      (newRowTemplateFunc ? 1 : 0);
    if (autoGrowMaxRows) {
      height = Math.min(autoGrowMaxRows * rowHeight, rowCount * rowHeight);
    }
    return (
      <EditableGridBase
        ref={ref => {
          this._grid = ref;
        }}
        height={height}
        width={width}
        style={{ ...STYLE, ...style }}
        fixedRowCount={headerRowCount}
        fixedColumnCount={fixedColumnCount}
        columnWidth={200}
        columnCount={columns.length}
        rowHeight={rowHeight}
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
