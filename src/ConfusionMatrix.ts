import * as d3 from 'd3';
import * as $ from 'jquery';
import * as events from 'phovea_core/src/event';
import 'select2';
import { IAppView } from './app';
import { AppConstants } from './AppConstants';
import { EChartOrientation, FNChartColumn, FPChartColumn } from './ChartColumn';
import { ACellRenderer, applyRendererChain, ERenderer, IMatrixRendererChain, removeListeners } from './confusion_matrix_cell/ACellRenderer';
import { ACell, LabelCell, MatrixCell, PanelCell } from './confusion_matrix_cell/Cell';
import { Line, MatrixHeatCellContent } from './confusion_matrix_cell/CellContent';
import { createCellRendererConfig, ICellRendererConfig } from './confusion_matrix_cell/CellRendererConfig';
import { DataStoreApplicationProperties, DataStoreCellSelection, DataStoreLoadedRuns, ERenderMode } from './DataStore';
import { loadMatrixData } from './data_provider/MatrixDataLoader';
import { Language } from './language';
import { ILoadedMalevoDataset } from './MalevoDataset';
import { simulateClick, zip } from './utils';


export interface ICellData {
  linecell: Line[];
  heatcell: MatrixHeatCellContent;
}

/** Represents the confusion matrix plus its surrounding cells (FP/FN cells) and class filter */
export class ConfusionMatrix implements IAppView {
  private readonly $node: d3.Selection<any>;
  private $matrixWrapper: d3.Selection<any>;
  private $confusionMatrix: d3.Selection<any>;
  private $classSelector: d3.Selection<any>;
  private $labelsTop: d3.Selection<any>;
  private $labelsLeft: d3.Selection<any>;
  private fpColumn: FPChartColumn;
  private fnColumn: FNChartColumn;
  private $cells = null;
  private cellsBottomRight: d3.Selection<any>;
  private cellRendererConfig: ICellRendererConfig;

  constructor(parent: Element) {
    this.$node = d3.select(parent)
      .append('div')
      .classed('grid', true);
  }

  /**
   * Initialize the view and return a promise
   * that is resolved as soon the view is completely initialized.
   * @returns {Promise<ConfusionMatrix>}
   */
  init() {
    this.attachListeners();
    this.setupLayout();
    // return the promise directly as long there is no dynamical data to update
    return Promise.resolve(this);
  }

  /** Is called on initialization. Set the class selector dropdown
   * and sets the cell fields of the Malevo instance
   */
  private setupLayout() {
    const $axisTop = this.$node.append('div')
      .classed('cfm-axis', true)
      .classed('axis-top', true)
      .html(`
        <div>${Language.PREDICTED}</div>
        <div class="dropdown">
          <a href="#" id="classSelectorLabel" type="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
            <i class="fa fa-cog" aria-hide="true" title="${Language.SELECT_CLASSES}"></i>
            <span class="sr-only">${Language.SELECT_CLASSES}</span>
          </a>

          <div class="dropdown-menu" aria-labelledby="classSelectorLabel">
            <div class="checkbox select-all"><label><input type="checkbox" value="all">Select all</label></div>
            <div class="form-group"></div>
            <div class="form-footer">
              <p class="text-warning hidden">Select at least 2 classes</p>
              <button type="button" class="btn btn-sm btn-primary">${Language.APPLY}</button>
            </div>
          </div>
        </div>
      `);

    this.$classSelector = $axisTop.select('.dropdown-menu');

    this.$classSelector.select('button').on('click', () => {
      $($axisTop.select('#classSelectorLabel').node()).dropdown('toggle');
      const classIds = this.$classSelector.selectAll('div.form-group input[type="checkbox"]:checked')[0].map((d: HTMLInputElement) => +d.value);
      DataStoreApplicationProperties.selectedClassIndices = classIds;
      return false;
    });

    this.$node.append('div')
      .classed('cfm-axis', true)
      .classed('axis-left', true)
      .append('span')
      .text(Language.GROUND_TRUTH);

    const $labelRight = this.$node.append('div')
      .classed('malevo-label', true)
      .classed('label-right', true);

    $labelRight.append('div')
      .text(Language.FN);

    const $labelBottom = this.$node.append('div')
      .classed('malevo-label', true)
      .classed('label-bottom', true)
      .html(`<span>${Language.FP}</span>`);

    this.$labelsTop = this.$node.append('div')
      .classed('malevo-label', true)
      .classed('label-top', true)
      .append('div')
      .classed('labels', true);

    this.$labelsLeft = this.$node.append('div')
      .classed('malevo-label', true)
      .classed('label-left', true)
      .append('div')
      .classed('labels', true);

    this.$matrixWrapper = this.$node.append('div')
      .classed('matrix-wrapper', true)
      .attr('data-aspect-ratio', 'one-by-one');

    this.$confusionMatrix = this.$matrixWrapper.append('div').classed('matrix', true);

    const $chartRight = this.$node.append('div').classed('chart-right', true);
    this.fnColumn = new FNChartColumn($chartRight.append('div'), EChartOrientation.COLUMN);

    const $chartBottom = this.$node.append('div').classed('chart-bottom', true);
    this.fpColumn = new FPChartColumn($chartBottom.append('div'), EChartOrientation.ROW);

    const numRightColumns = 1; // number of additional columns
    this.$node.style('--num-right-columns', numRightColumns);

    const numBottomColumns = 1; // number of additional columns
    this.$node.style('--num-bottom-columns', numBottomColumns);

    this.cellsBottomRight = this.$node.append('div').classed('chart-bottom-right', true);
  }

  private attachListeners() {
    // is called when the user changes the timeline
    events.on(AppConstants.EVENT_REDRAW, (evt) => {
      this.updateViews();
    });

    // is called when the user clicks on the transpose button
    events.on(AppConstants.EVENT_CELL_RENDERER_TRANSPOSED, (evt, isTransposed) => {
      this.$matrixWrapper.classed('transpose-cells', isTransposed);
      this.removeConfusionMatrixCells();
      this.renderConfusionMatrixCells(this.cellRendererConfig);
    });

    // is called when the user switches from line charts to heamaps vis or vice versa
    events.on(AppConstants.EVENT_CELL_RENDERER_CHANGED, (evt, newCellRenderer: ERenderer) => {
      this.removeConfusionMatrixCells();
      this.renderConfusionMatrixCells(this.cellRendererConfig);
    });

    events.on(AppConstants.EVENT_CLASS_INDICES_CHANGED, (evt) => {
      this.render();
    });
  }

  private clearDetailView() {
    events.fire(AppConstants.CLEAR_CONF_MEASURES_VIEW);
    events.fire(AppConstants.EVENT_CLEAR_DETAIL_CHART);
  }

  // is called to elicit the render mode
  private chooseRenderMode(datasets: ILoadedMalevoDataset[]) {
    DataStoreApplicationProperties.renderMode = ERenderMode.CLEAR;

    const singleEpochDataExists = function (data: ILoadedMalevoDataset) {
      return !!data.singleEpochData;
    };

    const multiEpochDataExists = function (data: ILoadedMalevoDataset) {
      return !!data.multiEpochData && data.multiEpochData.length > 0;
    };
    // if at least one single epoch selection exists
    // => update render mode
    datasets.forEach((x) => {
      if (singleEpochDataExists(x)) {
        // tslint:disable-next-line:no-bitwise
        DataStoreApplicationProperties.renderMode |= ERenderMode.SINGLE;
        return;
      }
    });

    // if at least one multi epoch selection exist
    // => update render mode
    datasets.forEach((x) => {
      if (multiEpochDataExists(x)) {
        // tslint:disable-next-line:no-bitwise
        DataStoreApplicationProperties.renderMode |= ERenderMode.MULTI;
        return;
      }
    });

  }

  /*
   * Core method of this class: load the data from the server and renders them
   */
  private updateViews() {
    loadMatrixData().then((allDatasets: ILoadedMalevoDataset[]) => {
      DataStoreLoadedRuns.runs = allDatasets;

      if (allDatasets.length === 0) {
        this.clear();
        this.clearDetailView();
        return;
      }

      if (DataStoreApplicationProperties.selectedClassIndices.length === 0) {
        DataStoreApplicationProperties.selectedClassIndices = allDatasets[0].labelIds; // -> fires event -> listener calls render()
      } else {
        this.render();
      }
      this.renderClassSelector(allDatasets[0].labelIds, allDatasets[0].labels, DataStoreApplicationProperties.selectedClassIndices);
    });
  }

  /*
   * The actual render method for the confusion matrix:
   * load the runs and the selected classes
   * and render the cells
   */
  private render() {
    const filteredAllDatasets = this.filter(DataStoreLoadedRuns.runs, DataStoreApplicationProperties.selectedClassIndices);

    // update CSS classes for new matrix size
    this.$node.classed(`grid-${AppConstants.CONF_MATRIX_SIZE}`, false);
    AppConstants.CONF_MATRIX_SIZE = DataStoreApplicationProperties.selectedClassIndices.length;
    this.$node.classed(`grid-${AppConstants.CONF_MATRIX_SIZE}`, true);
    this.$node.style('--matrix-size', AppConstants.CONF_MATRIX_SIZE);

    // determine the cell sizes before the actual rendering starts to avoid layout trashing by the browser
    // must be done after adding the size CSS classes to the matrix $node
    DataStoreApplicationProperties.confMatrixCellSize = this.determineCellSize(DataStoreApplicationProperties.selectedClassIndices.length);

    this.chooseRenderMode(filteredAllDatasets);
    this.renderCells(filteredAllDatasets);
    if (DataStoreLoadedRuns.runs.length > 0) {
      this.addRowAndColumnLabels(filteredAllDatasets[0].labels);
    }
    this.updateSelectedCell();
  }

  private filter(datasets: ILoadedMalevoDataset[], indexArray: number[]): ILoadedMalevoDataset[] {
    return datasets.map((ds: ILoadedMalevoDataset) => {
      const newMultiEpochData = ds.multiEpochData.map((epoch) => {
        const newMatrix = epoch.confusionData.filter(indexArray);
        return { name: epoch.name, id: epoch.id, confusionData: newMatrix };
      });

      const newSingleEpochData = {
        name: ds.singleEpochData.name,
        confusionData: ds.singleEpochData.confusionData.filter(indexArray),
        id: ds.singleEpochData.id
      };

      return {
        multiEpochData: newMultiEpochData,
        singleEpochData: newSingleEpochData,
        labels: indexArray.map((x) => ds.labels[x]),
        labelIds: indexArray.map((x) => ds.labelIds[x]),
        datasetColor: ds.datasetColor,
        classSizes: indexArray.map((x) => ds.classSizes[x])
      };
    });
  }

  /**
   * Calculates the cell width and height based on the node size of the confusion matrix divided by the number of classes
   *
   * @param classLength Number of labels
   */
  private determineCellSize(classLength: number): number[] {
    const node = <HTMLElement>this.$confusionMatrix.node();
    const size = (node.clientWidth / classLength) - 2;
    return [size, size];
  }

  private renderClassSelector(labelIds: number[], labels: string[], selected: number[]) {
    this.$classSelector.select('.select-all input').property('checked', (labelIds.length === selected.length));

    this.$classSelector.on('click', () => {
      (<any>d3.event).stopPropagation(); // prevent closing the bootstrap dropdown
    });

    this.$classSelector.select('.select-all input').on('change', () => {
      const isSelectAll = this.$classSelector.select('.select-all input').property('checked');
      this.$classSelector.select('div.form-group').selectAll('input[type="checkbox"]').property('checked', isSelectAll);
      this.$classSelector.select('.form-footer button').property('disabled', (isSelectAll === false));
      this.$classSelector.select('.form-footer p').classed('hidden', (isSelectAll === true));
    });

    const $labels = this.$classSelector.select('div.form-group').selectAll('div.checkbox').data(zip([labelIds, labels]));
    const $labelsEnter = $labels.enter().append('div').classed('checkbox', true)
      .html((d) => {
        return `<label><input type="checkbox" value="${d[0]}">${d[1]}</label>`;
      });
    $labelsEnter.select('input')
      .property('checked', (d) => (selected.indexOf(d[0]) > -1))
      .on('change', () => {
        const numSelected = this.$classSelector.selectAll('div.form-group input[type="checkbox"]:checked')[0].length;
        this.$classSelector.select('.form-footer button').property('disabled', (numSelected < 2));
        this.$classSelector.select('.form-footer p').classed('hidden', (numSelected >= 2));
        this.$classSelector.select('.select-all input').property('checked', numSelected === labelIds.length);
      });
    $labels.exit().remove();
  }

  private addRowAndColumnLabels(labels: string[]) {
    this.renderLabels(this.$labelsLeft, labels);
    this.renderLabels(this.$labelsTop, labels);
  }

  private renderLabels($node: d3.Selection<any>, labels: string[]) {
    const $cells = $node.selectAll('div')
      .data(labels);

    $cells.enter()
      .append('div')
      .classed('cell', true)
      .classed('label-cell', true);

    $cells
      .html((datum: string) => `<span>${datum}</span>`);

    $cells.exit().remove();
  }

  private removeConfusionMatrixCells() {
    removeListenersFromCells(this.$confusionMatrix);
    this.$confusionMatrix.selectAll('div').remove();
  }

  clear() {
    this.removeConfusionMatrixCells(); // TODO Try to avoid removing all cells and use D3 enter-update instead
    removeListenersFromCells(this.fpColumn.$node);
    removeListenersFromCells(this.fnColumn.$node);
    this.fpColumn.$node.selectAll('div').remove();
    this.fnColumn.$node.selectAll('div').remove();

    this.cellsBottomRight.select('div').remove();
  }

  private renderCells(datasets: ILoadedMalevoDataset[]) {
    this.clear();
    if (DataStoreApplicationProperties.renderMode === ERenderMode.CLEAR) {
      return;
    }

    this.cellRendererConfig = createCellRendererConfig(DataStoreApplicationProperties.renderMode, datasets, [this.setWeightUpdateListener, this.setYAxisScaleListener]);
    this.renderConfusionMatrixCells(this.cellRendererConfig);
    this.renderFPFN(this.cellRendererConfig);
    this.renderOverallAccuracyCell(this.cellRendererConfig, datasets.map((x) => x.datasetColor));

    this.updateSelectedCell();
    events.fire(AppConstants.EVENT_RENDER_CONF_MEASURE, this.cellRendererConfig);
  }

  private renderConfusionMatrixCells(cellRendererConfig: ICellRendererConfig) {
    const datasets: ILoadedMalevoDataset[] = cellRendererConfig.datasets;
    const data = cellRendererConfig.data;

    const cellData = data.map((d, index) => {
      const groundTruth = Math.floor(index / AppConstants.CONF_MATRIX_SIZE);
      if (index % (AppConstants.CONF_MATRIX_SIZE + 1) === 0) {
        return new LabelCell({ label: datasets[0].labels[groundTruth] });
      }
      const lineCellContent = data[index].linecell !== null ? data[index].linecell.map((x) => [x]) : null;
      const res = { linecell: lineCellContent, heatcell: data[index].heatcell };
      const predicted = index % AppConstants.CONF_MATRIX_SIZE;
      return new MatrixCell(
        res,
        datasets[0].labels[predicted],
        datasets[0].labels[groundTruth],
        predicted,
        groundTruth
      );
    });

    const cellSize = DataStoreApplicationProperties.confMatrixCellSize;

    this.$cells = this.$confusionMatrix
      .selectAll('div')
      .data(cellData);

    this.$cells.enter()
      .append('div')
      .classed('cell', true)
      .each(function (d: ACell) {
        d.init(d3.select(this), cellSize[0], cellSize[1]);
      });

    const confMatrixRendererProto: IMatrixRendererChain = cellRendererConfig.confMatrixRendererProto;
    this.$cells.each((cell: ACell, index) => {
      const target = index % (AppConstants.CONF_MATRIX_SIZE + 1) !== 0 ? confMatrixRendererProto.offdiagonal : confMatrixRendererProto.diagonal;
      applyRendererChain(confMatrixRendererProto, cell, target);
      cell.render();
    });
  }

  private renderOverallAccuracyCell(cellRendererConfig: ICellRendererConfig, colors: string[]) {
    const cellSize = DataStoreApplicationProperties.confMatrixCellSize;
    const data: number[][] = cellRendererConfig.dataOverallAccuracy;
    const renderer: IMatrixRendererChain = cellRendererConfig.overallAccuracyRendererProto;
    const singleEpochIndex: number[] = cellRendererConfig.singleEpochIndex;
    const maxVal = Math.max(...[].concat(...data));
    const res = {
      linecell: data.map((x, i) => [{ values: x, valuesInPercent: x, max: maxVal, predictedLabel: null, groundTruthLabel: null, color: colors[i] }]),
      heatcell: { indexInMultiSelection: singleEpochIndex, counts: null, maxVal: 0, classLabels: null, colorValues: null }
    };
    const cell = new PanelCell(res, AppConstants.CELL_OVERALL_ACCURACY_SCORE, -1, -1);

    const $overallAccuracyCell = this.cellsBottomRight
      .append('div')
      .classed('cell', true)
      .datum(cell);

    cell.init($overallAccuracyCell, cellSize[0], cellSize[1]);
    applyRendererChain(renderer, cell, renderer.diagonal);
    cell.render();
  }

  private renderFPFN(cellRendererConfig: ICellRendererConfig) {
    this.fpColumn.render(cellRendererConfig.data, cellRendererConfig.fpFnRendererProto, cellRendererConfig.singleEpochIndex);
    this.fnColumn.render(cellRendererConfig.data, cellRendererConfig.fpFnRendererProto, cellRendererConfig.singleEpochIndex);
  }

  private setWeightUpdateListener(renderer: ACellRenderer) {
    renderer.addWeightFactorChangedListener();
  }

  private setYAxisScaleListener(renderer: ACellRenderer) {
    renderer.addYAxisScaleChangedListener();
  }

  private updateSelectedCell() {
    const selectedCell = DataStoreCellSelection.getCell();
    if (selectedCell === null) {
      // select the cell by click event and update the DataStoreCellSelection.cell
      // -> the event will bring us here again, but then with a selected cell
      simulateClick(this.cellsBottomRight.select('.cell').node());
      return;

    } else if (selectedCell instanceof MatrixCell) {
      const newCell = d3.select(this.$cells[0][selectedCell.groundTruthIndex * AppConstants.CONF_MATRIX_SIZE + selectedCell.predictedIndex]).datum();
      DataStoreCellSelection.cellSelected(newCell);

    } else if (selectedCell instanceof PanelCell) {
      let newCell = null;
      if (selectedCell.type === AppConstants.CELL_FP) {
        newCell = d3.select(this.fpColumn.$node.selectAll('.cell')[0][selectedCell.panelColumnIndex]).datum();
      } else if (selectedCell.type === AppConstants.CELL_FN) {
        newCell = d3.select(this.fnColumn.$node.selectAll('.cell')[0][selectedCell.panelColumnIndex]).datum();
      } else if (selectedCell.type === AppConstants.CELL_OVERALL_ACCURACY_SCORE) {
        newCell = this.cellsBottomRight.select('.cell').datum();
      }
      DataStoreCellSelection.cellSelected(newCell);
    }
  }
}

/**
 * Factory method to create a new HeatMap instance
 * @param parent
 * @param options
 * @returns {ConfusionMatrix}
 */
export function create(parent: Element, options: any) {
  return new ConfusionMatrix(parent);
}

function removeListenersFromCells(element: d3.Selection<any>) {
  return element.selectAll('div.cell')
    .each((d: ACell) => removeListeners(d.renderer, [(r: ACellRenderer) => r.removeWeightFactorChangedListener(), (r: ACellRenderer) => r.removeYAxisScaleChangedListener()]));
}
