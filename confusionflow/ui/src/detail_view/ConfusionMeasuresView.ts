/**
 * Created by Martin on 09.07.2018.
 */
import * as d3 from 'd3';
import * as events from 'phovea_core/src/event';
import { IAppView } from '../app';
import { AppConstants } from '../AppConstants';
import * as confMeasures from '../ConfusionMeasures';
import { applyRendererChain, IMatrixRendererChain } from '../confusion_matrix_cell/ACellRenderer';
import { ACell, LabelCell, PanelCell, MetricsPanelCell } from '../confusion_matrix_cell/Cell';
import { DataStoreApplicationProperties, DataStoreCellSelection, ERenderMode } from '../DataStore';
import { Matrix, max } from '../DataStructures';
import { Language } from '../language';
import { ILoadedMalevoDataset } from '../MalevoDataset';
import { zip } from '../utils';
import { ICellRendererConfig } from '../confusion_matrix_cell/CellRendererConfig';

export default class ConfusionMeasuresView implements IAppView {
  private parentHeight = 0;
  private $node: d3.Selection<any>;

  constructor(parent: Element) {
    this.parentHeight = parent.clientHeight;

    this.$node = d3.select(parent).append('table');
    this.$node.append('thead').append('tr');
    this.$node.append('tbody');
  }

  /**
   * Initialize the view and return a promise
   * that is resolved as soon the view is completely initialized.
   * @returns {Promise<Timeline>}
   */
  init() {
    this.attachListener();
    // return the promise directly as long there is no dynamical data to update
    return Promise.resolve(this);
  }

  private attachListener() {
    events.on(AppConstants.EVENT_RENDER_CONF_MEASURE, (evt, cellRendererConfig: ICellRendererConfig) => {
      if (DataStoreApplicationProperties.renderMode === ERenderMode.SINGLE) {
        this.clear();
        return;
      }
      const { header, rows, rendererProtos } = this.prepareData(cellRendererConfig);
      this.renderTable(header, rows, rendererProtos);
      this.updateSelectedCell();
    });

    events.on(AppConstants.CLEAR_CONF_MEASURES_VIEW, () => {
      this.clear();
    });
  }

  private clear() {
    this.$node.selectAll('td').html('');
  }

  private prepareData(cellRendererConfig: ICellRendererConfig) {
    const datasets: ILoadedMalevoDataset[] = cellRendererConfig.datasets;
    const singleEpochIndex: number[] = cellRendererConfig.singleEpochIndex;
    const lineChartRendererProto: IMatrixRendererChain = cellRendererConfig.overallAccuracyRendererProto;
    const labelRendererProto: IMatrixRendererChain = cellRendererConfig.labelRendererProto;
    const classSizeRendererProto: IMatrixRendererChain = cellRendererConfig.classSizeRendererProto;

    let dataPrecision = null;
    let dataRecall = null;
    let dataF1 = null;

    if (DataStoreApplicationProperties.renderMode === ERenderMode.SINGLE) {
      dataPrecision = datasets.map((x) => confMeasures.calcEvolution([x.singleEpochData.confusionData], confMeasures.PPV));
      dataRecall = datasets.map((x) => confMeasures.calcEvolution([x.singleEpochData.confusionData], confMeasures.TPR));
      dataF1 = datasets.map((x) => confMeasures.calcEvolution([x.singleEpochData.confusionData], confMeasures.F1));

    } else {
      dataPrecision = datasets.map((x) => confMeasures.calcEvolution(x.multiEpochData.map((y) => y.confusionData), confMeasures.PPV));
      dataRecall = datasets.map((x) => confMeasures.calcEvolution(x.multiEpochData.map((y) => y.confusionData), confMeasures.TPR));
      dataF1 = datasets.map((x) => confMeasures.calcEvolution(x.multiEpochData.map((y) => y.confusionData), confMeasures.F1));
    }

    const labels = this.renderClassLabels(datasets);
    let columnIndex = 1;
    const precisions = this.renderPrecisionColumn(dataPrecision, datasets[0].labels, singleEpochIndex, datasets.map((x) => x.datasetColor), columnIndex);
    const recalls = this.renderRecallColumn(dataRecall, datasets[0].labels, singleEpochIndex, datasets.map((x) => x.datasetColor), ++columnIndex);
    const f1Scores = this.renderF1ScoreColumn(dataF1, datasets[0].labels, singleEpochIndex, datasets.map((x) => x.datasetColor), ++columnIndex);
    const classSizes = this.renderClassSize(datasets, datasets.map((x) => x.datasetColor), ++columnIndex);

    return {
      header: [
        { label: Language.CLASS_LABELS, width: '12.5%' },
        { label: Language.PRECISION, width: '25%' },
        { label: Language.RECALL, width: '25%' },
        { label: Language.F1_SCORE, width: '25%' },
        { label: Language.CLASS_SIZE, width: '12.5%' }
      ],
      rows: zip([labels, precisions, recalls, f1Scores, classSizes]),
      rendererProtos: [labelRendererProto, lineChartRendererProto, lineChartRendererProto, lineChartRendererProto, classSizeRendererProto]
    };
  }

  private renderClassLabels(datasets: ILoadedMalevoDataset[]): LabelCell[] {
    const classLabelData = datasets[0].labels;
    return classLabelData.map((datum) => {
      return new LabelCell({ label: String(datum) });
    });
  }

  private renderF1ScoreColumn(data: Matrix<number[]>[], labels: string[], singleEpochIndex: number[], colors: string[], columnIndex: number): PanelCell[] {
    const maxVal = Math.max(...data.map((x: Matrix<number[]>) => max(x, (d) => Math.max(...d))));
    let transformedData = data.map((x) => x.to1DArray());
    transformedData = zip(transformedData);

    return transformedData.map((datum, index) => {
      const res = {
        linecell: datum.map((x, i) => [{
          values: x,
          valuesInPercent: x,
          max: maxVal,
          predictedLabel: labels[index],
          groundTruthLabel: null,
          color: colors[i]
        }]),
        heatcell: {
          indexInMultiSelection: singleEpochIndex,
          counts: null,
          maxVal: 0,
          classLabels: null,
          colorValues: null
        }
      };
      return new MetricsPanelCell(res, AppConstants.CELL_F1_SCORE, columnIndex, index);
    });
  }

  private renderRecallColumn(data: Matrix<number[]>[], labels: string[], singleEpochIndex: number[], colors: string[], columnIndex: number): PanelCell[] {
    const maxVal = Math.max(...data.map((x: Matrix<number[]>) => max(x, (d) => Math.max(...d))));
    let transformedData = data.map((x) => x.to1DArray());
    transformedData = zip(transformedData);

    return transformedData.map((datum, index) => {
      const res = {
        linecell: datum.map((x, i) => [{
          values: x,
          valuesInPercent: x,
          max: maxVal,
          predictedLabel: labels[index],
          groundTruthLabel: null,
          color: colors[i]
        }]),
        heatcell: {
          indexInMultiSelection: singleEpochIndex,
          counts: null,
          maxVal: 0,
          classLabels: null,
          colorValues: null
        }
      };
      return new MetricsPanelCell(res, AppConstants.CELL_RECALL, columnIndex, index);
    });
  }

  private renderPrecisionColumn(data: Matrix<number[]>[], labels: string[], singleEpochIndex: number[], colors: string[], columnIndex: number): PanelCell[] {
    const maxVal = Math.max(...data.map((x: Matrix<number[]>) => max(x, (d) => Math.max(...d))));
    let transformedData = data.map((x) => x.to1DArray());
    transformedData = zip(transformedData);

    return transformedData.map((datum, index) => {
      const res = {
        linecell: datum.map((x, i) => [{
          values: x,
          valuesInPercent: x,
          max: maxVal,
          predictedLabel: labels[index],
          groundTruthLabel: null,
          color: colors[i]
        }]),
        heatcell: {
          indexInMultiSelection: singleEpochIndex,
          counts: null,
          maxVal: 0,
          classLabels: null,
          colorValues: null
        }
      };
      return new MetricsPanelCell(res, AppConstants.CELL_PRECISION, columnIndex, index);
    });
  }

  private renderClassSize(datasets: ILoadedMalevoDataset[], colors: string[], columnIndex: number): PanelCell[] {
    let transformedData = datasets.map((x) => x.classSizes);
    transformedData = zip(transformedData);
    return transformedData.map((x, index) => {
      const res = {
        linecell: null,
        heatcell: {
          indexInMultiSelection: null,
          counts: x,
          maxVal: 0,
          classLabels: null,
          colorValues: colors
        }
      };
      return new MetricsPanelCell(res, AppConstants.CELL_CLASS_SIZE, columnIndex, index);
    });
  }

  private renderTable(header: { label: string, width: string }[], rows: ACell[][], rendererProtos: IMatrixRendererChain[]) {
    const $header = this.$node.select('thead tr').selectAll('th').data(header);
    $header.enter().append('th').style('width', (d) => d.width).text((d) => d.label);
    $header.exit().remove();

    const $trs = this.$node.select('tbody').selectAll('tr').data(rows);
    $trs.enter().append('tr');

    const $tds = $trs.selectAll('td').data((d) => d);
    $tds.enter().append('td');

    // inserting the td elements cause a relayout of the table -> read the cell size after the td elements are added
    const cellSizes = Array.from(this.$node.select('thead tr').node().childNodes)
      .map((th: HTMLElement) => {
        return {
          cellWidth: th.clientWidth,
          cellHeight: (this.parentHeight - th.clientHeight) / rows.length
        };
      });

    $tds.each(function (cell, i) {
      const $td = d3.select(this);
      $td.html(''); // remove before adding a new svg
      cell.init($td, cellSizes[i].cellWidth, cellSizes[i].cellHeight);
      applyRendererChain(rendererProtos[i], cell, rendererProtos[i].diagonal);
      cell.render();
      return null;
    });

    $tds.exit().remove();
    $trs.exit().remove();
  }

  private updateSelectedCell() {
    const selectedCell = DataStoreCellSelection.getCell();
    if (selectedCell !== null) {
      if (selectedCell instanceof PanelCell && this.isConfusionMeasuresViewCellType(selectedCell)) {
        const newCell = this.$node.select('tbody')
          .selectAll('tr')
          .filter((d, i) => i === selectedCell.panelRowIndex)
          .selectAll('td')
          .filter((d, i) => i === selectedCell.panelColumnIndex).datum();
        console.assert(selectedCell.panelColumnIndex === newCell.panelColumnIndex && selectedCell.panelRowIndex === newCell.panelRowIndex);
        DataStoreCellSelection.cellSelected(newCell);
      }
    }
  }

  private isConfusionMeasuresViewCellType(cell: PanelCell) {
    const type = cell.type;
    return type === AppConstants.CELL_PRECISION || type === AppConstants.CELL_RECALL || type === AppConstants.CELL_F1_SCORE || type === AppConstants.CELL_CLASS_SIZE;
  }
}

/**
 * Factory method to create a new HeatMap instance
 * @param parent
 * @param options
 * @returns {ConfusionMeasuresView}
 */
export function create(parent: Element, options: any) {
  return new ConfusionMeasuresView(parent);
}
