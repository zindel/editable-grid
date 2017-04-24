import React, { PropTypes, Component } from "react";
import { Grid } from "react-virtualized";

function ensureRange(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

const SCROLLBAR_SIZE_BUFFER = 20;
const NORMAL_CELL = {
  borderRight: "1px solid #ddd",
  borderBottom: "1px solid #ddd"
};
const FOCUSED_CELL = {
  border: "2px solid blue"
};

const DOUBLE_BORDER_RIGHT = { borderRight: "2px solid #ddd" };
const DOUBLE_BORDER_BOTTOM = { borderBottom: "2px solid #ddd" };
const HEADER = { fontWeight: "bold" };

/**
 * Renders 1, 2, or 4 Grids depending on configuration.
 * A main (body) Grid will always be rendered.
 * Optionally, 1-2 Grids for sticky header rows will also be rendered.
 * If no sticky columns, only 1 sticky header Grid will be rendered.
 * If sticky columns, 2 sticky header Grids will be rendered.
 */
export default class EditableGridBase extends Component {
  static propTypes = {
    fixedColumnCount: PropTypes.number.isRequired,
    fixedRowCount: PropTypes.number.isRequired,
    style: PropTypes.object.isRequired
  };

  static defaultProps = {
    fixedColumnCount: 0,
    fixedRowCount: 0,
    style: {}
  };

  constructor(props, context) {
    super(props, context);

    this.state = {
      scrollLeft: 0,
      scrollTop: 0,
      focusedCol: 0,
      focusedRow: props.fixedRowCount,
      isEditing: false
    };

    this._deferredInvalidateColumnIndex = null;
    this._deferredInvalidateRowIndex = null;

    this._cellRendererBottomLeftGrid = this._cellRendererBottomLeftGrid.bind(
      this
    );
    this._cellRendererBottomRightGrid = this._cellRendererBottomRightGrid.bind(
      this
    );
    this._cellRendererTopRightGrid = this._cellRendererTopRightGrid.bind(this);
    this._columnWidthRightGrid = this._columnWidthRightGrid.bind(this);
    this._onScroll = this._onScroll.bind(this);
    this._rowHeightBottomGrid = this._rowHeightBottomGrid.bind(this);
  }

  onKeyUp = e => {
    let { isCellEditable } = this.props;
    let { focusedCol, focusedRow, isEditing } = this.state;

    if (isEditing) {
      return;
    }

    if (
      (e.key === "Enter" || e.key.length === 1) &&
      isCellEditable(focusedRow, focusedCol)
    ) {
      this.startEditing(e.key.length === 1 ? e.key : null);
    }
  };

  onKeyDown = e => {
    let incRow = 0, incCol = 0;
    let { focusedCol, focusedRow, isEditing } = this.state;
    let { fixedRowCount, columnCount, rowCount } = this.props;

    if (isEditing) {
      return;
    }

    switch (e.key) {
      case "ArrowRight":
        incCol = 1;
        break;
      case "ArrowLeft":
        incCol = -1;
        break;
      case "ArrowUp":
        incRow = -1;
        break;
      case "ArrowDown":
        incRow = 1;
        break;
      default:
        break;
    }

    this.setState({
      ...this.state,
      focusedCol: ensureRange(focusedCol + incCol, 0, columnCount - 1),
      focusedRow: ensureRange(focusedRow + incRow, fixedRowCount, rowCount - 1)
    });
  };

  onClick = (e, row, column) => {
    let { isCellEditable, fixedColumnCount, fixedRowCount } = this.props;
    let { isEditing } = this.state;
    /*if (isEditing) {
      this.stopEditing(true);
    }*/
    let newState = {};
    if (isCellEditable(row, column)) {
      newState.isEditing = true;
      newState.initialValue = null;
    }
    this.setState({
      ...this.state,
      focusedRow: row,
      focusedCol: column,
      ...newState
    });
  };

  /** See Grid#invalidateCellSizeAfterRender */
  invalidateCellSizeAfterRender(
    {
      columnIndex = 0,
      rowIndex = 0
    } = {}
  ) {
    this._deferredInvalidateColumnIndex = typeof this._deferredInvalidateColumnIndex ===
      "number"
      ? Math.min(this._deferredInvalidateColumnIndex, columnIndex)
      : columnIndex;
    this._deferredInvalidateRowIndex = typeof this._deferredInvalidateRowIndex ===
      "number"
      ? Math.min(this._deferredInvalidateRowIndex, rowIndex)
      : rowIndex;
  }

  /** See Grid#measureAllCells */
  measureAllCells() {
    this._refBottomLeft && this._refBottomLeft.measureAllCells();
    this._refBottomRight && this._refBottomRight.measureAllCells();
    this._refTopLeft && this._refTopLeft.measureAllCells();
    this._refTopRight && this._refTopRight.measureAllCells();
  }

  /** See Grid#recomputeGridSize */
  recomputeGridSize({ columnIndex = 0, rowIndex = 0 } = {}) {
    const { fixedColumnCount, fixedRowCount } = this.props;

    const adjustedColumnIndex = Math.max(0, columnIndex - fixedColumnCount);
    const adjustedRowIndex = Math.max(0, rowIndex - fixedRowCount);

    this._refBottomLeft &&
      this._refBottomLeft.recomputeGridSize({
        columnIndex,
        rowIndex: adjustedRowIndex
      });
    this._refBottomRight &&
      this._refBottomRight.recomputeGridSize({
        columnIndex: adjustedColumnIndex,
        rowIndex: adjustedRowIndex
      });
    this._refTopLeft &&
      this._refTopLeft.recomputeGridSize({
        columnIndex,
        rowIndex
      });
    this._refTopRight &&
      this._refTopRight.recomputeGridSize({
        columnIndex: adjustedColumnIndex,
        rowIndex
      });

    this._leftGridWidth = null;
    this._topGridHeight = null;
    this._maybeCalculateCachedStyles(null, this.props, null, this.state);
  }

  componentDidMount() {
    const { scrollLeft, scrollTop } = this.props;

    if (scrollLeft > 0 || scrollTop > 0) {
      const newState = {};

      if (scrollLeft > 0) {
        newState.scrollLeft = scrollLeft;
      }

      if (scrollTop > 0) {
        newState.scrollTop = scrollTop;
      }

      this.setState(newState);
    }
    this._handleInvalidatedGridSize();
  }

  componentDidUpdate(prevProps, prevState) {
    this._handleInvalidatedGridSize();
  }

  componentWillMount() {
    this._maybeCalculateCachedStyles(null, this.props, null, this.state);
  }

  componentWillReceiveProps(nextProps, nextState) {
    const {
      columnWidth,
      fixedColumnCount,
      fixedRowCount,
      rowHeight
    } = this.props;

    if (
      columnWidth !== nextProps.columnWidth ||
      fixedColumnCount !== nextProps.fixedColumnCount
    ) {
      this._leftGridWidth = null;
    }

    if (
      fixedRowCount !== nextProps.fixedRowCount ||
      rowHeight !== nextProps.rowHeight
    ) {
      this._topGridHeight = null;
    }

    if (
      nextProps.scrollLeft !== this.props.scrollLeft ||
      nextProps.scrollTop !== this.props.scrollTop
    ) {
      const newState = {};

      if (nextProps.scrollLeft != null && nextProps.scrollLeft >= 0) {
        newState.scrollLeft = nextProps.scrollLeft;
      }

      if (nextProps.scrollTop != null && nextProps.scrollTop >= 0) {
        newState.scrollTop = nextProps.scrollTop;
      }

      this.setState(newState);
    }

    this._maybeCalculateCachedStyles(
      this.props,
      nextProps,
      this.state,
      nextState
    );
  }

  render() {
    const {
      onScroll,
      onSectionRendered,
      scrollLeft: scrollLeftProp, // eslint-disable-line no-unused-vars
      scrollToColumn,
      scrollTop: scrollTopProp, // eslint-disable-line no-unused-vars
      scrollToRow,
      ...rest
    } = this.props;

    // This mirrors what Grid does,
    // And prevents us from recording inaccurage measurements when used with CellMeasurer.
    if (this.props.width === 0 || this.props.height === 0) {
      return null;
    }

    const {
      scrollLeft,
      scrollTop
    } = this.state;

    return (
      <div
        style={this._containerOuterStyle}
        ref={ref => {
          this._refContainer = ref;
        }}
        tabIndex={0}
        onKeyDown={this.onKeyDown}
        onKeyUp={this.onKeyUp}
      >
        <div style={this._containerTopStyle}>
          {this._renderTopLeftGrid(rest)}
          {this._renderTopRightGrid({
            ...rest,
            scrollLeft
          })}
        </div>
        <div style={this._containerBottomStyle}>
          {this._renderBottomLeftGrid({
            ...rest,
            onScroll,
            onSectionRendered,
            scrollToRow,
            scrollTop
          })}
          {this._renderBottomRightGrid({
            ...rest,
            onScroll,
            onSectionRendered,
            scrollLeft,
            scrollToColumn,
            scrollToRow,
            scrollTop
          })}
        </div>
      </div>
    );
  }

  stopEditing(value) {
    let { onCellValueChange } = this.props;
    if (onCellValueChange && value !== undefined) {
      let { focusedCol, focusedRow } = this.state;
      onCellValueChange(focusedRow, focusedCol, value);
    }

    this.setState(
      {
        ...this.state,
        isEditing: false
      },
      () => {
        //let { focusedCol, focusedRow } = this.state;
        this._refBottomLeft && this._refBottomLeft.forceUpdate();
        this._refBottomRight && this._refBottomRight.forceUpdate();
        this._refTopLeft && this._refTopLeft.forceUpdate();
        this._refTopRight && this._refTopRight.forceUpdate();
        this.focus();
      }
    );
  }

  startEditing(initialValue) {
    this.setState(
      {
        ...this.state,
        isEditing: true,
        initialValue
      },
      () => {
        //let { focusedCol, focusedRow } = this.state;
        this._refBottomLeft && this._refBottomLeft.forceUpdate();
        this._refBottomRight && this._refBottomRight.forceUpdate();
        this._refTopLeft && this._refTopLeft.forceUpdate();
        this._refTopRight && this._refTopRight.forceUpdate();
      }
    );
  }

  _cellRenderer({ key, style, ...rest }) {
    let { focusedCol, focusedRow, isEditing, initialValue } = this.state;
    let { column, row } = rest;
    return (
      <div key={key} style={style} onClick={e => this.onClick(e, row, column)}>
        {this.props.cellRenderer({
          ...rest,
          initialValue,
          parent: this,
          isEditing: isEditing && focusedCol === column && focusedRow === row,
          onSaveChange: (value) => {
            this.stopEditing(value);
          },
          onCancelChange: () => {
            this.stopEditing();
          }
        })}
      </div>
    );
  }

  _cellRendererBottomLeftGrid({ columnIndex, rowIndex, style, ...rest }) {
    const { fixedRowCount } = this.props;
    let { focusedCol, focusedRow } = this.state;

    let focused = focusedCol === columnIndex &&
      focusedRow - fixedRowCount === rowIndex;
    let newStyle = { ...style, ...(focused ? FOCUSED_CELL : NORMAL_CELL) };

    return this._cellRenderer({
      ...rest,
      style: newStyle,
      parent: this,
      column: columnIndex,
      row: rowIndex + fixedRowCount
    });
  }

  _cellRendererBottomRightGrid({ columnIndex, rowIndex, style, ...rest }) {
    const { fixedColumnCount, fixedRowCount } = this.props;

    let { focusedCol, focusedRow } = this.state;

    let focused = focusedCol - fixedColumnCount === columnIndex &&
      focusedRow - fixedRowCount === rowIndex;
    let newStyle = { ...style, ...(focused ? FOCUSED_CELL : NORMAL_CELL) };

    return this._cellRenderer({
      ...rest,
      style: newStyle,
      parent: this,
      column: columnIndex + fixedColumnCount,
      row: rowIndex + fixedRowCount
    });
  }

  _cellRendererTopRightGrid({ columnIndex, rowIndex, ...rest }) {
    const {
      columnCount,
      fixedColumnCount
    } = this.props;

    if (columnIndex === columnCount - fixedColumnCount) {
      return (
        <div
          key={rest.key}
          style={{
            ...rest.style,
            width: SCROLLBAR_SIZE_BUFFER
          }}
        />
      );
    } else {
      return this._cellRenderer({
        ...rest,
        column: columnIndex + fixedColumnCount,
        row: rowIndex,
        parent: this
      });
    }
  }

  _columnWidthRightGrid({ index }) {
    const { columnCount, fixedColumnCount, columnWidth } = this.props;

    // An extra cell is added to the count
    // This gives the smaller Grid extra room for offset,
    // In case the main (bottom right) Grid has a scrollbar
    // If no scrollbar, the extra space is overflow:hidden anyway
    if (index === columnCount - fixedColumnCount) {
      return SCROLLBAR_SIZE_BUFFER;
    }

    return typeof columnWidth === "function"
      ? columnWidth({ index: index + fixedColumnCount })
      : columnWidth;
  }

  _getBottomGridHeight(props) {
    const { height } = props;

    let topGridHeight = this._getTopGridHeight(props);

    return height - topGridHeight;
  }

  _getLeftGridWidth(props) {
    const { fixedColumnCount, columnWidth } = props;

    if (this._leftGridWidth == null) {
      if (typeof columnWidth === "function") {
        let leftGridWidth = 0;

        for (let index = 0; index < fixedColumnCount; index++) {
          leftGridWidth += columnWidth({ index });
        }

        this._leftGridWidth = leftGridWidth;
      } else {
        this._leftGridWidth = columnWidth * fixedColumnCount;
      }
    }

    return this._leftGridWidth;
  }

  _getRightGridWidth(props) {
    const { width } = props;

    let leftGridWidth = this._getLeftGridWidth(props);

    return width - leftGridWidth;
  }

  _getTopGridHeight(props) {
    const { fixedRowCount, rowHeight } = props;

    if (this._topGridHeight == null) {
      if (typeof rowHeight === "function") {
        let topGridHeight = 0;

        for (let index = 0; index < fixedRowCount; index++) {
          topGridHeight += rowHeight({ index });
        }

        this._topGridHeight = topGridHeight;
      } else {
        this._topGridHeight = rowHeight * fixedRowCount;
      }
    }

    return this._topGridHeight;
  }

  _handleInvalidatedGridSize() {
    if (typeof this._deferredInvalidateColumnIndex === "number") {
      const columnIndex = this._deferredInvalidateColumnIndex;
      const rowIndex = this._deferredInvalidateRowIndex;

      this._deferredInvalidateColumnIndex = null;
      this._deferredInvalidateRowIndex = null;

      this.recomputeGridSize({
        columnIndex,
        rowIndex
      });
      this.forceUpdate();
    }
  }

  /**
   * Avoid recreating inline styles each render; this bypasses Grid's shallowCompare.
   * This method recalculates styles only when specific props change.
   */
  _maybeCalculateCachedStyles(prevProps, props, prevState, state) {
    const {
      columnWidth,
      height,
      fixedColumnCount,
      fixedRowCount,
      rowHeight,
      style,
      width
    } = props;

    const firstRender = !prevProps;
    const sizeChange = firstRender ||
      height !== prevProps.height ||
      width !== prevProps.width;
    const leftSizeChange = firstRender ||
      columnWidth !== prevProps.columnWidth ||
      fixedColumnCount !== prevProps.fixedColumnCount;
    const topSizeChange = firstRender ||
      fixedRowCount !== prevProps.fixedRowCount ||
      rowHeight !== prevProps.rowHeight;

    if (firstRender || sizeChange || style !== prevProps.style) {
      this._containerOuterStyle = {
        height,
        overflow: "hidden", // Let :focus outline show through
        width,
        ...style
      };
    }

    if (firstRender || sizeChange || topSizeChange) {
      this._containerTopStyle = {
        height: this._getTopGridHeight(props),
        position: "relative",
        width
      };

      this._containerBottomStyle = {
        height: height - this._getTopGridHeight(props),
        overflow: "hidden",
        position: "relative",
        width
      };
    }

    if (firstRender) {
      this._styleBottomLeft = {
        left: 0,
        overflowX: "hidden",
        overflowY: "hidden",
        position: "absolute",
        ...DOUBLE_BORDER_RIGHT
      };
    }

    if (firstRender || leftSizeChange) {
      this._bottomRightGridStyle = {
        left: this._getLeftGridWidth(props),
        position: "absolute"
      };
    }

    if (firstRender) {
      this._topLeftGridStyle = {
        left: 0,
        overflowX: "hidden",
        overflowY: "hidden",
        position: "absolute",
        top: 0,
        ...DOUBLE_BORDER_RIGHT,
        ...DOUBLE_BORDER_BOTTOM,
        ...HEADER
      };
    }

    if (firstRender || leftSizeChange) {
      this._topRightGridStyle = {
        left: this._getLeftGridWidth(props),
        overflowX: "hidden",
        overflowY: "hidden",
        position: "absolute",
        top: 0,
        ...DOUBLE_BORDER_BOTTOM,
        ...HEADER
      };
    }
  }

  _onScroll(scrollInfo) {
    const { scrollLeft, scrollTop } = scrollInfo;
    this.setState({
      scrollLeft,
      scrollTop
    });
    const onScroll = this.props.onScroll;
    if (onScroll) {
      onScroll(scrollInfo);
    }
  }

  _renderBottomLeftGrid(props) {
    const {
      fixedColumnCount,
      fixedRowCount,
      rowCount,
      scrollTop
    } = props;

    if (!fixedColumnCount) {
      return null;
    }

    let { focusedCol, focusedRow } = this.state;

    return (
      <Grid
        {...props}
        cellRenderer={this._cellRendererBottomLeftGrid}
        columnCount={fixedColumnCount}
        height={this._getBottomGridHeight(props)}
        ref={ref => {
          this._refBottomLeft = ref;
        }}
        onScroll={this._onScroll}
        rowCount={
          Math.max(0, rowCount - fixedRowCount) +
            1 /* See _rowHeightBottomGrid */
        }
        rowHeight={this._rowHeightBottomGrid}
        scrollTop={scrollTop}
        scrollToColumn={focusedCol}
        scrollToRow={focusedRow - fixedRowCount}
        style={this._styleBottomLeft}
        tabIndex={null}
        width={this._getLeftGridWidth(props)}
      />
    );
  }

  _renderBottomRightGrid(props) {
    const {
      columnCount,
      fixedColumnCount,
      fixedRowCount,
      rowCount
    } = props;

    let { focusedCol, focusedRow } = this.state;

    return (
      <Grid
        {...props}
        cellRenderer={this._cellRendererBottomRightGrid}
        columnCount={Math.max(0, columnCount - fixedColumnCount)}
        columnWidth={this._columnWidthRightGrid}
        height={this._getBottomGridHeight(props)}
        onScroll={this._onScroll}
        ref={ref => {
          this._refBottomRight = ref;
        }}
        rowCount={Math.max(0, rowCount - fixedRowCount)}
        rowHeight={this._rowHeightBottomGrid}
        scrollToColumn={focusedCol - fixedColumnCount}
        scrollToRow={focusedRow - fixedRowCount}
        style={this._bottomRightGridStyle}
        width={this._getRightGridWidth(props)}
        tabIndex={null}
      />
    );
  }

  _renderTopLeftGrid(props) {
    const {
      fixedColumnCount,
      fixedRowCount
    } = props;

    if (!fixedColumnCount || !fixedRowCount) {
      return null;
    }

    return (
      <Grid
        {...props}
        columnCount={fixedColumnCount}
        height={this._getTopGridHeight(props)}
        ref={ref => {
          this._refTopLeft = ref;
        }}
        rowCount={fixedRowCount}
        style={this._topLeftGridStyle}
        tabIndex={null}
        width={this._getLeftGridWidth(props)}
      />
    );
  }

  _renderTopRightGrid(props) {
    const {
      columnCount,
      fixedColumnCount,
      fixedRowCount,
      scrollLeft
    } = props;

    if (!fixedRowCount) {
      return null;
    }

    return (
      <Grid
        {...props}
        cellRenderer={this._cellRendererTopRightGrid}
        columnCount={
          Math.max(0, columnCount - fixedColumnCount) +
            1 /* See _columnWidthRightGrid */
        }
        columnWidth={this._columnWidthRightGrid}
        height={this._getTopGridHeight(props)}
        ref={ref => {
          this._refTopRight = ref;
        }}
        rowCount={fixedRowCount}
        scrollLeft={scrollLeft}
        style={this._topRightGridStyle}
        tabIndex={null}
        width={this._getRightGridWidth(props)}
      />
    );
  }

  _rowHeightBottomGrid({ index }) {
    const { fixedRowCount, rowCount, rowHeight } = this.props;

    // An extra cell is added to the count
    // This gives the smaller Grid extra room for offset,
    // In case the main (bottom right) Grid has a scrollbar
    // If no scrollbar, the extra space is overflow:hidden anyway
    if (index === rowCount - fixedRowCount) {
      return SCROLLBAR_SIZE_BUFFER;
    }

    return typeof rowHeight === "function"
      ? rowHeight({ index: index + fixedRowCount })
      : rowHeight;
  }

  focus() {
    this._refContainer && this._refContainer.focus();
  }

}
