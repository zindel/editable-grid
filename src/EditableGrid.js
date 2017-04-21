import React, { PropTypes, Component } from "react";
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
    this._grid = null;
  }

  cellRenderer = cellProps => {
    let { data } = this.state;
    let { columns } = this.props;
    let { row, column, isEditing } = cellProps;
    let rowObj = data.get(row);
    if (rowObj === undefined) {
      return <span>&nbsp;</span>;
    }

    let id = this.ids[column];
    let value = rowObj.get(id);
    let { renderView, renderEdit } = columns[column];

    return isEditing && renderEdit
      ? renderEdit({ ...cellProps, value })
      : renderView({ ...cellProps, value });
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
      />
    );
  }

  focus() {
    this._grid.focus();
  }
}
