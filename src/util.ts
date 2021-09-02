import * as hotFormulaParser from "hot-formula-parser";
import * as Types from "./types";
import * as Matrix from "./matrix";
import * as Point from "./point";
import * as PointRange from "./point-range";
import * as Formula from "./formula";

export { createEmpty as createEmptyMatrix } from "./matrix";

export type FormulaParseResult = string | boolean | number;
export type FormulaParseError = string;

export const PLAIN_TEXT_MIME = "text/plain";

/** Move the cursor of given input element to the input's end */
export function moveCursorToEnd(el: HTMLInputElement): void {
  el.selectionStart = el.selectionEnd = el.value.length;
}

/**
 * Creates an array of numbers (positive and/or negative) progressing from start up to, but not including, end. A step of -1 is used if a negative start is specified without an end or step. If end is not specified, it's set to start with start then set to 0.
 * @param end - an integer number specifying at which position to stop (not included).
 * @param start - An integer number specifying at which position to start.
 * @param step - An integer number specifying the incrementation
 */
export function range(end: number, start = 0, step = 1): number[] {
  const array = [];
  if (Math.sign(end - start) === -1) {
    for (let element = start; element > end; element -= step) {
      array.push(element);
    }
    return array;
  }
  for (let element = start; element < end; element += step) {
    array.push(element);
  }
  return array;
}

/** Return whether given point is active */
export function isActive(
  active: Types.StoreState["active"],
  point: Point.Point
): boolean {
  return Boolean(active && Point.isEqual(point, active));
}

/** Get the offset values of given element */
export function getOffsetRect(element: HTMLElement): Types.Dimensions {
  return {
    width: element.offsetWidth,
    height: element.offsetHeight,
    left: element.offsetLeft,
    top: element.offsetTop,
  };
}

/** Write given data to clipboard with given event */
export function writeTextToClipboard(
  event: ClipboardEvent,
  data: string
): void {
  event.clipboardData?.setData(PLAIN_TEXT_MIME, data);
}

/** Read text from given clipboard event */
export function readTextFromClipboard(event: ClipboardEvent): string {
  // @ts-ignore
  if (window.clipboardData && window.clipboardData.getData) {
    // @ts-ignore
    return window.clipboardData.getData("Text");
  }
  if (event.clipboardData && event.clipboardData.getData) {
    return event.clipboardData.getData(PLAIN_TEXT_MIME);
  }
  return "";
}

/** Get the dimensions of cell at point from state */
export function getCellDimensions(
  point: Point.Point,
  state: Types.StoreState
): Types.Dimensions | undefined {
  const rowDimensions = state.rowDimensions[point.row];
  const columnDimensions = state.columnDimensions[point.column];
  return (
    rowDimensions &&
    columnDimensions && { ...rowDimensions, ...columnDimensions }
  );
}

/** Get the dimensions of a range of cells */
export function getRangeDimensions(
  state: Types.StoreState,
  range: PointRange.PointRange
): Types.Dimensions | undefined {
  const startDimensions = getCellDimensions(range.start, state);
  const endDimensions = getCellDimensions(range.end, state);
  return (
    startDimensions &&
    endDimensions && {
      width: endDimensions.left + endDimensions.width - startDimensions.left,
      height: endDimensions.top + endDimensions.height - startDimensions.top,
      top: startDimensions.top,
      left: startDimensions.left,
    }
  );
}

/** Get the computed value of a cell. */
export function getComputedValue<Cell extends Types.CellBase<Value>, Value>({
  cell,
  formulaParser,
}: {
  cell: Cell | undefined;
  formulaParser: hotFormulaParser.Parser;
}): Value | FormulaParseResult | FormulaParseError | null {
  if (cell === undefined) {
    return null;
  }
  if (isFormulaCell(cell)) {
    return getFormulaComputedValue({ cell, formulaParser });
  }
  return cell.value;
}

/** Get the computed value of a formula cell */
export function getFormulaComputedValue({
  cell,
  formulaParser,
}: {
  cell: Types.CellBase<string>;
  formulaParser: hotFormulaParser.Parser;
}): FormulaParseResult | FormulaParseError | null {
  const formula = Formula.extractFormula(cell.value);
  const { result, error } = formulaParser.parse(formula);
  return error || result;
}

/** Returns whether given cell contains a formula value */
export function isFormulaCell(
  cell: Types.CellBase
): cell is Types.CellBase<string> {
  return Formula.isFormulaValue(cell.value);
}

/** Normalize given selected range to given data matrix */
export function normalizeSelected(
  selected: Types.Selected,
  data: Matrix.Matrix<unknown>
): Types.Selected {
  const dataRange = getMatrixRange(data);
  return PointRange.is(selected)
    ? PointRange.mask(selected, dataRange)
    : selected;
}

/** Get selected points */
export function getSelectedPoints(selected: Types.Selected): Point.Point[] {
  return PointRange.is(selected)
    ? Array.from(PointRange.iterate(selected))
    : [];
}

/** Get the point range of given matrix */
export function getMatrixRange(
  data: Matrix.Matrix<unknown>
): PointRange.PointRange {
  const maxPoint = Matrix.maxPoint(data);
  return PointRange.create(Point.ORIGIN, maxPoint);
}

/** Get given selected range from given data as CSV */
export function getSelectedCSV(
  selected: Types.Selected,
  data: Matrix.Matrix<Types.CellBase>
): string {
  if (!PointRange.is(selected)) {
    return "";
  }
  const selectedData = getRangeFromMatrix(selected, data);
  return getCSV(selectedData);
}

/** Get given data as CSV */
export function getCSV(data: Matrix.Matrix<Types.CellBase>): string {
  const valueMatrix = Matrix.map((cell) => cell?.value || "", data);
  return Matrix.join(valueMatrix);
}

export function getRangeFromMatrix<T>(
  range: PointRange.PointRange,
  matrix: Matrix.Matrix<T>
): Matrix.Matrix<T> {
  return Matrix.slice(range.start, range.end, matrix);
}

/**
 * Calculate the rows and columns counts of a spreadsheet
 * @param data - the spreadsheet's data
 * @param rowLabels - the spreadsheet's row labels (if defined)
 * @param columnLabels - the spreadsheet's column labels (if defined)
 * @returns the rows and columns counts of a spreadsheet
 */
export function calculateSpreadsheetSize(
  data: Matrix.Matrix<unknown>,
  rowLabels?: string[],
  columnLabels?: string[]
): Matrix.Size {
  const { columns, rows } = Matrix.getSize(data);
  return {
    rows: rowLabels ? Math.max(rows, rowLabels.length) : rows,
    columns: columnLabels ? Math.max(columns, columnLabels.length) : columns,
  };
}
