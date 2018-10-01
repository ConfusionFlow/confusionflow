/**
 * Created by Martin on 13.02.2018.
 */
import * as d3 from 'd3';
import * as events from 'phovea_core/src/event';
import { AppConstants } from './AppConstants';
import { MatrixCell, PanelCell } from './confusion_matrix_cell/Cell';
import { ILoadedMalevoDataset, IMalevoEpochInfo, MalevoDataset } from './MalevoDataset';
import { ERenderer } from './confusion_matrix_cell/ACellRenderer';

export const dataStoreRuns: Map<string, DataStoreSelectedRun> = new Map<string, DataStoreSelectedRun>();

export class DataStoreLoadedRuns {
  static runs: ILoadedMalevoDataset[];
}

/**
 * Stores the selected runs
 * for a single epoch and for an epoch range
 */
export class DataStoreSelectedRun {
  singleSelected: IMalevoEpochInfo = null;
  multiSelected: IMalevoEpochInfo[] = [];

  static runIndexArray = Array(AppConstants.MAX_DATASET_COUNT).fill(null);
  color: string;

  /**
   * Returns an index that is currently not in use
   * @returns {number}
   */
  static getFreeIndex() {
    const index = DataStoreSelectedRun.runIndexArray.findIndex((x) => x === null);
    console.assert(index >= 0 && index < AppConstants.MAX_DATASET_COUNT);
    return index;
  }

  static setSelectionIndex(index: number, run: DataStoreSelectedRun) {
    DataStoreSelectedRun.runIndexArray[index] = run;
  }

  /**
   * Initializes colors for each run
   * @returns {Array}
   */
  static getColors(): string[] {
    const colorScale = d3.scale.category10();
    const colors = [];
    for (let i = 0; i < AppConstants.MAX_DATASET_COUNT; i++) {
      colors.push(colorScale(String(i)));
    }
    return colors;
  }

  constructor(public selectedDataset: MalevoDataset = null, public selectionIndex: number, public isLoading: boolean) {
    this.color = DataStoreSelectedRun.getColors()[selectionIndex];
  }

  /**
   * Creates a new run object, saves it in the collection
   * and fires the necessary events
   * @param ds
   */
  static add(ds: MalevoDataset) {
    const selectionIndex = DataStoreSelectedRun.getFreeIndex();
    const newRunObject = new DataStoreSelectedRun(ds, selectionIndex, true);
    DataStoreSelectedRun.setSelectionIndex(selectionIndex, newRunObject);
    dataStoreRuns.set(ds.name, newRunObject);
    DataStoreSelectedRun.updateRuns();
    events.fire(AppConstants.EVENT_DATA_SET_ADDED, ds);
    events.fire(AppConstants.EVENT_REDRAW);
  }

  /**
   * Is called when a run has to be removed
   * This method is the counterpart to add()
   * @param ds
   */
  static remove(ds: MalevoDataset) {
    DataStoreSelectedRun.setSelectionIndex(dataStoreRuns.get(ds.name).selectionIndex, null);
    dataStoreRuns.delete(ds.name);
    if (dataStoreRuns.size === 0) {
      DataStoreCellSelection.deselect();
    }
    events.fire(AppConstants.EVENT_DATA_SET_REMOVED, ds);
    events.fire(AppConstants.EVENT_REDRAW);
  }

  /**
   * Is called when the timeline is altered or when a new run is added
   */
  static updateRuns() {
    dataStoreRuns.forEach((timeline) => {
      timeline.multiSelected = timeline.selectedDataset.epochInfos.slice(TimelineParameters.minIndex, TimelineParameters.maxIndex + 1);
      timeline.singleSelected = timeline.selectedDataset.epochInfos[TimelineParameters.singleIndex];
    });
  }
}

/**
 * Stores the state of the timeline
 */
export class TimelineParameters {
  static minIndex = -1;
  static maxIndex = -1;
  static singleIndex = -1;

  static setRange(minIndex: number, maxIndex: number) {
    TimelineParameters.minIndex = minIndex;
    TimelineParameters.maxIndex = maxIndex;
  }
}

/**
 * Stores confusion matrix single cell selection
 */
export class DataStoreCellSelection {
  private static cell: MatrixCell | PanelCell = null;

  /**
   * Is called when a run is removed
   */
  static deselect() {
    if (DataStoreCellSelection.cell !== null) {
      DataStoreCellSelection.cell.$node.classed('selected', false);
      DataStoreCellSelection.cell = null;
    }
  }

  /**
   * is called when a cell is selected
   * @param cell
   */
  static cellSelected(cell: MatrixCell | PanelCell) {
    if (!cell) {
      return;
    }
    if (DataStoreCellSelection.cell !== null) {
      DataStoreCellSelection.cell.$node.classed('selected', false);
    }
    DataStoreCellSelection.cell = cell;
    DataStoreCellSelection.cell.$node.classed('selected', true);
    events.fire(AppConstants.EVENT_CELL_SELECTED);
  }

  static getCell(): MatrixCell | PanelCell {
    return DataStoreCellSelection.cell;
  }
}

export enum ERenderMode {
  CLEAR = 0,
  SINGLE = 1,
  MULTI = 2,
  COMBINED = 3
}

/**
 * Stores every property that is modifiable by the user
 */
export class DataStoreApplicationProperties {
  private static _transposeCellRenderer = false;
  private static _confMatrixCellRenderer: ERenderer.HeatmapMultiEpoch | ERenderer.MatrixLineCell = ERenderer.HeatmapMultiEpoch;
  private static _isAbsolute = false;
  private static _weightFactorLinear = 1;
  private static _weightFactorLog = 1;
  private static _yScalingIsLinear = true;
  private static _renderMode: ERenderMode = ERenderMode.COMBINED;
  private static _selectedClassIndices: number[] = [];
  private static _confMatrixCellSize = [];
  private static _highlightedPredictedClass = '';
  private static _highlightedGroundTruthClass = '';
  private static _isHighlighted = false;

  static get renderMode(): ERenderMode {
    return this._renderMode;
  }

  static set renderMode(value: ERenderMode) {
    this._renderMode = value;
  }

  static get transposeCellRenderer(): boolean {
    return this._transposeCellRenderer;
  }

  static set transposeCellRenderer(value: boolean) {
    this._transposeCellRenderer = value;
    events.fire(AppConstants.EVENT_CELL_RENDERER_TRANSPOSED, this.transposeCellRenderer);
  }

  static toggleTransposeCellRenderer() {
    this._transposeCellRenderer = !this._transposeCellRenderer;
    events.fire(AppConstants.EVENT_CELL_RENDERER_TRANSPOSED, this.transposeCellRenderer);
  }

  static get confMatrixCellRenderer(): ERenderer.HeatmapMultiEpoch | ERenderer.MatrixLineCell {
    return this._confMatrixCellRenderer;
  }

  static set confMatrixCellRenderer(value: ERenderer.HeatmapMultiEpoch | ERenderer.MatrixLineCell) {
    this._confMatrixCellRenderer = value;
    events.fire(AppConstants.EVENT_CELL_RENDERER_CHANGED, this.confMatrixCellRenderer);
  }

  static get weightFactor(): number {
    return this._yScalingIsLinear ? this.weightFactorLinear : this.weightFactorLog;
  }

  static get weightFactorLinear(): number {
    return (this._weightFactorLinear === 0) ? 0.00001 : this._weightFactorLinear;
  }

  static get weightFactorLog(): number {
    return (this._weightFactorLog === 0) ? 0.00001 : this._weightFactorLog;
  }

  static set weightFactor(value: number) {
    this.yScalingIsLinear ? this.weightFactorLinear = value : this.weightFactorLog = value;
    events.fire(AppConstants.EVENT_WEIGHT_FACTOR_CHANGED, this.weightFactor);
  }

  static set weightFactorLinear(value: number) {
    this._weightFactorLinear = 1 - value;
  }

  static set weightFactorLog(value: number) {
    this._weightFactorLog = 1 - value;
  }

  static get yScalingIsLinear(): boolean {
    return this._yScalingIsLinear;
  }

  static toggleYScaling() {
    this._yScalingIsLinear = !this._yScalingIsLinear;
    events.fire(AppConstants.EVENT_WEIGHT_FACTOR_CHANGED, this.weightFactor);
  }

  static get switchToAbsolute(): boolean {
    return this._isAbsolute;
  }

  static set switchToAbsolute(val: boolean) {
    this._isAbsolute = val;
    events.fire(AppConstants.EVENT_SWITCH_SCALE_TO_ABSOLUTE, this.switchToAbsolute);
  }

  static get selectedClassIndices(): number[] {
    return this._selectedClassIndices;
  }

  static set selectedClassIndices(val: number[]) {
    this._selectedClassIndices = val;
    events.fire(AppConstants.EVENT_CLASS_INDICES_CHANGED, this.selectedClassIndices);
  }
  static get confMatrixCellSize(): number[] {
    return this._confMatrixCellSize;
  }

  static set confMatrixCellSize(value: number[]) {
    this._confMatrixCellSize = value;
  }

  static get isHighlighted() {
    return this._isHighlighted;
  }

  /**
   * Set combination of ground truth and predicted class as highlighted and fire `EVENT_MATRIX_CELL_HOVERED` event
   * @param groundTruthClass ground truth class
   * @param predictedClass predicted class
   */
  static setCellHighlight(groundTruthClass: string, predictedClass: string) {
    this._highlightedGroundTruthClass = groundTruthClass;
    this._highlightedPredictedClass = predictedClass;
    this._isHighlighted = true;
    events.fire(AppConstants.EVENT_MATRIX_CELL_HOVERED);
  }

  /**
   * Clear the highlighted cell and fire `EVENT_MATRIX_CELL_HOVERED` event
   */
  static clearCellHighlight() {
    if (this.isHighlighted === false) {
      return; // no cell is highlighted == do nothing
    }

    this._highlightedGroundTruthClass = '';
    this._highlightedPredictedClass = '';
    this._isHighlighted = false;
    events.fire(AppConstants.EVENT_MATRIX_CELL_HOVERED);
  }

  /**
   * Check if the selected ground truth AND the predicted class are equal to the given parameters.
   *
   * @param groundTruthClass ground truth class
   * @param predictedClass predicted class
   */
  static checkCellHighlight(groundTruthClass: string, predictedClass: string): boolean {
    return (this._highlightedGroundTruthClass === groundTruthClass && this._highlightedPredictedClass === predictedClass);
  }
}
