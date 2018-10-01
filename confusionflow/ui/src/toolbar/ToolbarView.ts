import * as d3 from 'd3';
import { IAppView } from '../app';
import { ConfusionMatrix } from '../ConfusionMatrix';
import { AppConstants } from '../AppConstants';
import * as events from 'phovea_core/src/event';
import * as plugins from 'phovea_core/src/plugin';
import { DataStoreApplicationProperties } from '../DataStore';
import { simulateClick } from "../utils";
import { ERenderer } from '../confusion_matrix_cell/ACellRenderer';

export class ToolbarView implements IAppView {

  private readonly $node: d3.Selection<any>;

  constructor(parent: Element) {
    this.$node = d3.select(parent)
      .append('div')
      .classed('toolbar', true);
  }

  /**
   * Initialize the view and return a promise
   * that is resolved as soon the view is completely initialized.
   * @returns {Promise<ToolbarView>}
   */
  init() {
    this.attachListeners();
    return this.build();
  }

  private attachListeners() {
    // nothing
  }

  /**
   * Load and initialize all necessary views
   * @returns {Promise<ToolbarView>}
   */
  private build(): Promise<ToolbarView> {
    this.createSwitchCellsVisDiv();
    this.createTransposeCellsDiv();
    this.createSwitchYAxisScale();
    this.addYScalingSlider();
    this.createYScalingDiv();
    return Promise.resolve(this);
  }

  private createSwitchYAxisScale() {
    const $div = this.$node.append('div')
      .classed('toolbar-switch-y-axis-scale', true)
      .classed('btn-group-vertical', true)
      .attr('role', 'group')
      .html(`
        <button class="btn btn-default absolute" title="Switch to absolute">
          <i class="fa fa-hashtag"></i>
          <span class="sr-only">&nbsp; Absolute Misclassification</span>
        </button>
        <button class="btn btn-default relative active" title="Switch to relative">
          <i class="fa fa-percent"></i>
          <span class="sr-only">&nbsp; Relative Misclassifications</span>
        </button>
      `);

    $div.select('button.absolute').on('click', () => {
      DataStoreApplicationProperties.switchToAbsolute = true;
      $div.selectAll('.active').classed('active', false);
      $div.select('button.absolute').classed('active', true);
    });

    $div.select('button.relative').on('click', () => {
      this.setStateToRelative();
    });
  }

  private setStateToRelative() {
    DataStoreApplicationProperties.switchToAbsolute = false;
    this.$node.select('div.toolbar-switch-y-axis-scale').selectAll('.active').classed('active', false);
    this.$node.select('div.toolbar-switch-y-axis-scale').select('button.relative').classed('active', true);
  }

  private createSwitchCellsVisDiv() {
    const $div = this.$node.append('div')
      .classed('toolbar-switch-cell-vis', true)
      .classed('btn-group-vertical', true)
      .attr('role', 'group')
      .html(`
        <button class="btn btn-default line-chart" title="Switch to line chart">
          <i class="fa fa-line-chart"></i>
          <span class="sr-only">&nbsp; Line Chart</span>
        </button>
        <button class="btn btn-default heatmap" title="Switch to heatmap">
          <i class="fa fa-barcode"></i>
          <span class="sr-only">&nbsp; Heatmap</span>
        </button>
      `);

    $div.select('button.line-chart')
      .classed('active', DataStoreApplicationProperties.confMatrixCellRenderer === ERenderer.MatrixLineCell)
      .on('click', () => {
        DataStoreApplicationProperties.confMatrixCellRenderer = ERenderer.MatrixLineCell;
        $div.selectAll('.active').classed('active', false);
        $div.select('button.line-chart').classed('active', true);
        this.$node.select('.toolbar-transpose-cell > button').attr('disabled', 'disabled');
      });

    $div.select('button.heatmap')
      .classed('active', DataStoreApplicationProperties.confMatrixCellRenderer === ERenderer.HeatmapMultiEpoch)
      .on('click', () => {
        DataStoreApplicationProperties.confMatrixCellRenderer = ERenderer.HeatmapMultiEpoch;
        this.$node.select('div.toolbar-switch-cell-vis').selectAll('.active').classed('active', false);
        this.$node.select('div.toolbar-switch-cell-vis').select('button.heatmap').classed('active', true);
        this.$node.select('.toolbar-transpose-cell > button').attr('disabled', null);
      });
  }

  private createTransposeCellsDiv() {
    const $div = this.$node.append('div')
      .classed('toolbar-transpose-cell', true)
      .html(`
        <button class="btn btn-default transpose-cell-renderer" title="Change direction of epochs">
          <i class="fa fa-long-arrow-right"></i>
          <span>epochs</span>
        </button>
      `)
      .select('button')
      .on('click', () => {
        DataStoreApplicationProperties.toggleTransposeCellRenderer();
        this.updateTransposeState($div);
      });
  }

  private updateTransposeState($div: d3.Selection<any>) {
    $div.select('i.fa')
      .classed('fa-long-arrow-right', DataStoreApplicationProperties.transposeCellRenderer === false)
      .classed('fa-long-arrow-down', DataStoreApplicationProperties.transposeCellRenderer === true);
    this.$node.select('.toolbar-switch-cell-vis > button.heatmap i.fa')
      .classed('fa-rotate-90', DataStoreApplicationProperties.transposeCellRenderer);
  }

  private createYScalingDiv() {
    const $div = this.$node.append('div')
      .classed('toolbar-scaling-cell', true)
      .html(`
        <button class="btn btn-default" title="Change y-scaling">
          <span class="ysc">lin</span>
        </button>
      `)
      .select('button')
      .on('click', () => {
        DataStoreApplicationProperties.toggleYScaling();
        this.updateYScalingState($div);
      });
  }

  private updateYScalingState($div: d3.Selection<any>) {
    $div.select('span.ysc')
      .text(() => {
        return DataStoreApplicationProperties.yScalingIsLinear ? 'lin' : 'log';
      });
    this.$node.select('div.y-scale-slider').select('input').property('value', 1 - DataStoreApplicationProperties.weightFactor);
  }

  private addYScalingSlider() {
    const $div = this.$node.append('div').classed('y-scale-slider', true);
    $div.html(`<input type="range" min="0.00" max="0.95" step="0.05" value="${1 - DataStoreApplicationProperties.weightFactor}" orient="vertical">`);
    $div.select('input')
      .on('input', function () {
        DataStoreApplicationProperties.weightFactor = this.value;
      });
  }

}

/**
 * Factory method to create a new HeatMap instance
 * @param parent
 * @param options
 * @returns {ToolbarView}
 */
export function create(parent: Element, options: any) {
  return new ToolbarView(parent);
}
