/**
 * Created by Martin on 27.01.2018.
 */
import * as d3 from "d3";
import { ICellData } from "./ConfusionMatrix";
import { PanelCell, ACell } from "./confusion_matrix_cell/Cell";
import {
  IMatrixRendererChain,
  applyRendererChain
} from "./confusion_matrix_cell/ACellRenderer";
import { AppConstants } from "./AppConstants";
import { DataStoreApplicationProperties } from "./DataStore";

export enum EChartOrientation {
  COLUMN,
  ROW
}

/**
 * Represents a column/row along the confusion matrix
 */
export abstract class ChartColumn {
  constructor(
    public $node: d3.Selection<any>,
    public readonly orientation: EChartOrientation
  ) {
    $node.classed("chart", true);
  }

  public render(
    data: ICellData[],
    rendererChain: IMatrixRendererChain,
    singleEpochIndex: number[]
  ) {
    const panelCells = this.createPanelCells(data, singleEpochIndex);
    const cellSize = DataStoreApplicationProperties.confMatrixCellSize;

    this.$node
      .selectAll("div")
      .data(panelCells)
      .enter()
      .append("div")
      .classed("cell", true)
      .each(function(cell: ACell) {
        cell.init(d3.select(this), cellSize[0], cellSize[1]);
        applyRendererChain(rendererChain, cell, rendererChain.diagonal);
        cell.render();
      });
  }

  protected abstract createPanelCells(
    data: ICellData[],
    singleEpochIndex: number[]
  ): PanelCell[];

  protected createCell(
    type: string,
    data: ICellData[],
    index: number,
    singleEpochIndex: number[]
  ): PanelCell {
    const confusionMatrixRow = data.map(x => x);
    const lineCells = confusionMatrixRow.map(x => x.linecell);
    const res =
      lineCells[index] !== null
        ? lineCells[0].map((_, i) =>
            lineCells.map((elem, j) => lineCells[j][i])
          )
        : null;
    return new PanelCell(
      {
        linecell: res,
        heatcell: {
          indexInMultiSelection: singleEpochIndex,
          counts: null,
          maxVal: 0,
          classLabels: null,
          colorValues: null
        }
      },
      type,
      index,
      -1
    );
  }
}

export class FPChartColumn extends ChartColumn {
  constructor(
    public $node: d3.Selection<any>,
    public readonly orientation: EChartOrientation
  ) {
    super($node, orientation);
  }

  protected createPanelCells(
    data: ICellData[],
    singleEpochIndex: number[]
  ): PanelCell[] {
    const res_tmp = [];
    for (let i = 0; i < AppConstants.CONF_MATRIX_SIZE; i++) {
      res_tmp.push(
        data.filter((_, j) => j % AppConstants.CONF_MATRIX_SIZE === i)
      );
    }

    // Don't overwrite origina data
    const res = JSON.parse(JSON.stringify(res_tmp));

    for (let i = 0; i < AppConstants.CONF_MATRIX_SIZE; i++) {
      // Get number of runs
      let num_runs = 0;
      res[i]
        .map(d => d["linecell"].length)
        .map(d => {
          num_runs = Math.max(d, num_runs);
        });

      let runs_values = Array.from(
        new Array(num_runs),
        (x, i) => i
      ).map(d => []);
      let runs_percentage = Array.from(
        new Array(num_runs),
        (x, i) => i
      ).map(d => []);

      let max_value = 0;

      res[i].map(d => {
        d["linecell"].map((x, j) => {
          if (runs_values[j].length == 0) {
            runs_values[j] = x["values"];
            runs_percentage[j] = x["valuesInPercent"];
          } else {
            if (x["values"].length != 0) {
              runs_values[j] = runs_values[j].map(
                (val, val_idx) => val + x["values"][val_idx]
              );
              runs_percentage[j] = runs_percentage[j].map(
                (val, val_idx) => val + x["valuesInPercent"][val_idx]
              );
            }
          }
          x["values"] = [];
          x["valuesInPercent"] = [];
          max_value = Math.max(max_value, x["max"]);
        });
      });

      res[i][i]["linecell"].map((x, j) => {
        x["values"] = runs_values[j];
        x["valuesInPercent"] = runs_percentage[j];
        x["max"] = max_value;
      });
    }

    return res.map((d: ICellData[], index) =>
      this.createCell(AppConstants.CELL_FP, d, index, singleEpochIndex)
    );
  }
}

export class FNChartColumn extends ChartColumn {
  constructor(
    public $node: d3.Selection<any>,
    public readonly orientation: EChartOrientation
  ) {
    super($node, orientation);
  }

  protected createPanelCells(
    data: ICellData[],
    singleEpochIndex: number[]
  ): PanelCell[] {
    data = data.slice(0);
    const arrays = [],
      size = AppConstants.CONF_MATRIX_SIZE;
    while (data.length > 0) {
      arrays.push(data.splice(0, size));
    }
    return arrays.map((d: ICellData[], index) =>
      this.createCell(AppConstants.CELL_FN, d, index, singleEpochIndex)
    );
  }
}
