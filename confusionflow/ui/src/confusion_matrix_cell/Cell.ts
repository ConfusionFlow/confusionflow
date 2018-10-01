import { Line, MatrixHeatCellContent } from './CellContent';
import { DataStoreCellSelection, DataStoreApplicationProperties } from '../DataStore';
import { ACellRenderer } from './ACellRenderer';
import { AppConstants } from '../AppConstants';
import * as events from 'phovea_core/src/event';

interface ICell {
  readonly $node: d3.Selection<any>;
  readonly height: number;
  readonly width: number;
  init($node: d3.Selection<any>, width: number, height: number);
  render();
}

/**
 * Indicates cells that can be rendered with a LineChartRenderer
 */
export interface ILineChartable {
  readonly weightFactor: number;
  data: { linecell: Line[][], heatcell: MatrixHeatCellContent };
}

/**
 * Represents a cell in the confusin matrix
 */
export abstract class ACell implements ICell {
  protected _$node: d3.Selection<any>;
  private _width: number;
  private _height: number;
  public renderer: ACellRenderer;

  constructor() {
    //
  }

  get $node(): d3.Selection<any> {
    return this._$node;
  }

  get width(): number {
    return this._width;
  }

  get height(): number {
    return this._height;
  }

  init($node: d3.Selection<any>, width: number = -1, height: number = -1) {
    this._$node = $node;
    this._width = (width < 0) ? (<HTMLElement>$node.node()).clientWidth : width;
    this._height = (height < 0) ? (<HTMLElement>$node.node()).clientHeight : height;
    this.attachListener();
  }

  protected abstract attachListener();

  public render() {
    this.renderer.renderNext(this);
  }
}

export class MatrixCell extends ACell implements ILineChartable {
  constructor(public data: { linecell: Line[][], heatcell: MatrixHeatCellContent },
    public predictedLabel: string, public groundTruthLabel: string,
    public predictedIndex: number, public groundTruthIndex: number) {
    super();
  }

  get weightFactor() {
    return DataStoreApplicationProperties.weightFactor;
  }

  protected attachListener() {
    this._$node.on('mouseover', () => {
      const cell = DataStoreCellSelection.getCell();

      if ((cell instanceof PanelCell) === false) {
        return;
      }

      let triggerHighlight = false;

      switch ((cell as PanelCell).type) {
        case AppConstants.CELL_FN:
          triggerHighlight = (cell.data.linecell[0][0].groundTruthLabel === this.groundTruthLabel);
          break;
        case AppConstants.CELL_FP:
          triggerHighlight = (cell.data.linecell[0][0].predictedLabel === this.predictedLabel);
          break;
      }

      if (triggerHighlight) {
        DataStoreApplicationProperties.setCellHighlight(this.groundTruthLabel, this.predictedLabel);
      }
    });

    this._$node.on('mouseout', () => {
      DataStoreApplicationProperties.clearCellHighlight();
    });

    this._$node.on('click', () => {
      DataStoreCellSelection.cellSelected(this);
    });
  }
}

export class LabelCell extends ACell {
  constructor(public labelData: { label: string }) {
    super();
  }

  protected attachListener() {
    // not used
  };
}

export class PanelCell extends ACell implements ILineChartable {
  constructor(public data: { linecell: Line[][], heatcell: MatrixHeatCellContent },
    public type: string, public panelColumnIndex: number, public panelRowIndex: number) {
    super();
  }

  hasType(types: string[]) {
    return types.includes(this.type);
  }

  get weightFactor() {
    return DataStoreApplicationProperties.weightFactor;
  }

  protected attachListener() {
    this._$node.on('click', () => {
      DataStoreCellSelection.cellSelected(this);
    });
  }
}

export class MetricsPanelCell extends PanelCell {
  constructor(public data: { linecell: Line[][], heatcell: MatrixHeatCellContent },
    public type: string, public panelColumnIndex: number, public panelRowIndex: number) {
    super(data, type, panelColumnIndex, panelRowIndex);
  }

  get weightFactor() {
    return 1.0; // return constant weightFactor to avoid scaling of the line chart renderer
  }
}

export class DetailChartCell extends ACell implements ILineChartable {
  public data: { linecell: Line[][], heatcell: MatrixHeatCellContent };

  constructor(public child: MatrixCell | PanelCell) {
    super();
    this.data = child.data;
  }

  get weightFactor() {
    return this.child.weightFactor;
  }

  protected attachListener() {
    // not used
  };
}
