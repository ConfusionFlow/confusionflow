/**
 * Created by Martin on 04.01.2018.
 */

import {MalevoDataset, IMalevoEpochInfo} from '../MalevoDataset';
import * as d3 from 'd3';
import {AppConstants} from '../AppConstants';
import {extractEpochId} from '../utils';
import {dataStoreRuns, DataStoreSelectedRun, TimelineParameters, DataStoreCellSelection} from '../DataStore';
import * as events from 'phovea_core/src/event';
import {MatrixCell, PanelCell} from "../confusion_matrix_cell/Cell";

class SingleEpochSelector {
  public $node: d3.Selection<any>;
  hidden = true;
  public curPos = -1;
  readonly selectorWidth = 2;
  readonly selectorHEIGHT = 30;

  constructor($parent: d3.Selection<any>, offsetH: number, private x: any) {
    this.$node = $parent.append('rect').classed('single-epoch-selector', true).attr('width', this.selectorWidth).attr('height', this.selectorHEIGHT)
      .attr('transform', `translate(${offsetH}, 0)`)
      .classed('hidden', this.hidden);
  }

  setPosition(pos: number) {
    const posX = this.x(String(Math.round(pos)));
    this.$node.attr('x', posX);
    this.hideNode(!(this.curPos !== pos || this.hidden === true));
    this.curPos = pos;
  }

  hideNode(val: boolean) {
    this.hidden = val;
    this.$node.classed('hidden', val);
  }
}

export class TimelineData {
  constructor(epochs: IMalevoEpochInfo[]) {
    this.build(epochs);
  }
  datapoints: DataPoint[] = [];

  build(epochs: IMalevoEpochInfo[]) {
    const length = epochs[epochs.length - 1].id;
    for (let i = 0; i <= length; i++) {
      const isValid = (epochs[i] !== null);
      const dp = new DataPoint(isValid, i, epochs[i]);
      this.datapoints.push(dp);
    }
  }
}

class DataPoint {
  constructor(public exists: boolean, public position: number, public epoch: IMalevoEpochInfo) {

  }
}

/**
 * Represents the timeline
 */
export class Timeline {
  private $node: d3.Selection<any> = null;
  private $label: d3.Selection<any> = null;
  data: TimelineData = null;
  singleEpochSelector = null;
  readonly MARGIN_LEFT = 0; // 20 pixel margin from left border
  readonly SHOW_LABEL = false;
  readonly tickmarkDistance = 5; // show ticks every 5 epoch
  readonly globalOffsetV = 15;
  private eventTimelineChangedListener = (evt: any, src: Timeline) => this.eventTimelineChanged(src);

  constructor(public datasetName: string, $parent: d3.Selection<any>) {
    this.build($parent);
    this.attachListeners();
  }

  build($parent) {
    if (this.$node) {
      this.$node.remove();
    }
    this.$node = $parent.append('g')
      .classed('timeline', true);
    this.createLabel(this.datasetName);
  }

  /**
   * Is called when the user changes the timeline
   * Updates the position of the single epoch selector
   * @param src
   */
  private eventTimelineChanged(src: Timeline) {
    // synchronizes single epoch marker
    if (this.singleEpochSelector === null || src === this) {
      return;
    }
    this.singleEpochSelector.setPosition(src.singleEpochSelector.curPos);
    this.singleEpochSelector.hideNode(src.singleEpochSelector.hidden);
    this.updateSingleSelection();
  }

  private attachListeners() {
    events.on(AppConstants.EVENT_TIMELINE_CHANGED, this.eventTimelineChangedListener);
  }

  detachListeners() {
    events.off(AppConstants.EVENT_TIMELINE_CHANGED, this.eventTimelineChangedListener);
  }

  createLabel(datasetName: string) {
    if (!this.SHOW_LABEL) {
      return;
    }

    this.$label = this.$node.append('g')
      .attr('transform', 'translate(0,' + this.globalOffsetV + ')')
      .append('text')
      .classed('tml-label', true)
      .style('fill', dataStoreRuns.get(this.datasetName).color)
      .text(datasetName);
  }

  getDSLabelWidth(): number {
    return (this.$label) ? (<any>this.$label[0][0]).getBBox().width : 0;
  }

  getWidth(): number {
    return (<any>this.$node[0][0]).getBBox().width;
  }

  node(): d3.Selection<any> {
    return this.$node;
  }

  /**
   * The actual render method
   * Initially renders the timeline and sets appropriate events
   * @param $parent
   * @param offsetH
   * @param offsetV
   */
  render($parent, offsetH: number, offsetV: number) {
    this.build($parent);
    this.$node.attr('transform', `translate(${this.MARGIN_LEFT}, ${offsetV})`);

    const width = this.data.datapoints.length * 5;
    const x = d3.scale.ordinal()
      .rangePoints([0, width])
      .domain(this.data.datapoints.map(function (d) {
        return String(d.position);
      }));

    const xAxis = d3.svg.axis()
      .scale(x)
      .tickValues(x.domain().filter((d, i) => {
        return i < this.data.datapoints.length && this.data.datapoints[i].exists && i % this.tickmarkDistance === 0;
      }))
      .orient('bottom')
      .tickSize(-7);

    this.$node.append('g')
      .attr('class', 'axis')
      .attr('transform', `translate(${offsetH}, ${this.globalOffsetV})`)
      .call(xAxis);

    const that = this;
    // Draw the brush
    const brush = d3.svg.brush()
      .x(<any>x);


    const $brushg = this.$node.append('g')
      .attr('transform', `translate(${offsetH}, 0)`)
      .attr('class', 'brush')
      .call(brush);

    $brushg.select('.extent')
      .style('fill', 'grey');

    brush.on('brush', () => this.brushmove(x, brush))
      .on('brushend', () => that.brushAndFire(x, brush));

    const brushHeight = 15;
    $brushg.selectAll('rect')
      .attr('height', brushHeight);

    this.createSingleSelector(width, offsetH, x);
    this.setBrush(brush, x, width);

    if (this.$label) {
      this.$label.on('dblclick', () => {
        // if at least 1 epoch was selected
        if (!brush.empty()) {
          //to clear the brush, call this.setBrush(brush, x, 0);
          this.setBrush(brush, x, width);
          events.fire(AppConstants.EVENT_REDRAW);
        }

      });
    }
  }

  /**
   * Is called when the user sets the brush
   * @param brush
   * @param x
   * @param width
   */
  setBrush(brush: any, x: any, width: number) {
    brush.extent([0, width]);
    this.brushmove(x, brush);
    this.brushend(x, brush);
  }

  createSingleSelector(width: number, offsetH: number, x: any) {
    const invert = d3.scale.linear().range(<any>x.domain()).domain(x.range());

    const posFromCoordinates = (coordinates: [number, number]) => {
      let pos = invert(coordinates[0]);
      pos = Math.round(pos);
      return pos;
    };

    const getNearestExistPos = (pos: number) => {

      // this can happen when the timeline  is too long and has no tickmarks
      // the timeline needs to be cropped (see https://github.com/Caleydo/malevo/pull/87)
      if (pos >= this.data.datapoints.length) {
        pos = this.data.datapoints.length - 1;
      }
      const upperIndex = this.ceil(pos);
      const lowerIndex = this.floor(pos);

      console.assert(upperIndex >= pos && pos >= lowerIndex);
      if (upperIndex - pos > pos - lowerIndex) {
        return lowerIndex;
      } else {
        return upperIndex;
      }
    };

    const markerWidth = 2;
    const markerHeight = 15;
    const $singleSelectionMarker = this.$node.append('rect').style('fill', 'rgb(0,0.255').attr('width', markerWidth)
      .attr('height', markerHeight)
      .attr('transform', `translate(${offsetH}, 0)`);

    const tml = this;
    this.singleEpochSelector = new SingleEpochSelector(this.$node, offsetH, x);
    const areaHeight = 15;
    this.$node.append('rect').attr('transform', `translate(${offsetH}, ${areaHeight + 1})`)
      .attr('width', width)
      .attr('height', areaHeight)
      .style('opacity', 0)
      .on('mousemove', function () {
        $singleSelectionMarker.classed('hidden', false);
        let pos = posFromCoordinates(d3.mouse(this));
        pos = getNearestExistPos(pos);
        $singleSelectionMarker.attr('x', x(pos.toString()));
      })
      .on('mouseup', function () {
        let pos = posFromCoordinates(d3.mouse(this));
        pos = getNearestExistPos(pos);
        tml.singleEpochSelector.setPosition(pos);
        // toggle single epoch selector
        tml.updateSingleSelection();
        events.fire(AppConstants.EVENT_TIMELINE_CHANGED, tml);
        events.fire(AppConstants.EVENT_REDRAW);
      })
      .on('mouseleave', function () {
        $singleSelectionMarker.classed('hidden', true);
      });
  }

  ceil(val: number) {
    if (val < 0) {
      return 0;
    } else if (val >= this.data.datapoints.length) {
      return this.data.datapoints.length - 1;
    }
    for (let i = val; i < this.data.datapoints.length; i++) {
      if (this.data.datapoints[i].exists) {
        return i;
      }
    }
    return null;
  }

  floor(val: number) {
    if (val < 0) {
      return 0;
    } else if (val >= this.data.datapoints.length) {
      return this.data.datapoints.length - 1;
    }
    for (let i = val; i >= 0; i--) {
      if (this.data.datapoints[i].exists) {
        return i;
      }
    }
    return null;
  }

  brushmove(x: any, brush: any) {
    const extent = brush.extent();
    const y = d3.scale.linear().range(x.domain()).domain(x.range());

    if (!brush.empty()) {
      const range = this.getDataIndices(+y(<number>extent[0]), +y(<number>extent[1]));
      if (range[0] < range[1]) {
        this.$node.select('g.brush').call(<any>brush.extent([y.invert(range[0]), y.invert(range[1])]));
        this.singleEpochSelector.setPosition(range[1]);
        this.singleEpochSelector.hideNode(false);
        events.fire(AppConstants.EVENT_TIMELINE_CHANGED, this);
      } else {
        this.$node.select('g.brush').call(<any>brush.clear());
      }
    }
  }

  brushAndFire(x: any, brush: any) {
    this.brushend(x, brush);
    events.fire(AppConstants.EVENT_REDRAW);
  }

  brushend(x: any, brush: any) {
    // if at least 1 epoch was selected
    if (!brush.empty()) {
      const extent = brush.extent();
      const y = d3.scale.linear().range(x.domain()).domain(x.range());
      const range = this.getDataIndices(+y(<number>extent[0]), +y(<number>extent[1]));

      TimelineParameters.setRange(range[0], range[1]);
      DataStoreSelectedRun.updateRuns();

      // set single epoch selector to the end
      this.singleEpochSelector.setPosition(range[1]);
      this.singleEpochSelector.hideNode(false);
      events.fire(AppConstants.EVENT_TIMELINE_CHANGED, this);
      this.updateSingleSelection();
    } else {
      TimelineParameters.setRange(-1, -1);
      DataStoreSelectedRun.updateRuns();
      this.$node.select('g.brush').call(<any>brush.clear());
    }
  }

  getSelectedEpochs(range: [number, number]) {
    const selEpochs = [];
    for (let i = range[0]; i <= range[1]; i++) {
      if (this.data.datapoints[i].exists) {
        selEpochs.push(this.data.datapoints[i].epoch);
      }
    }
    return selEpochs;
  }

  getDataIndices(n0: number, n1: number): [number, number] {
    if (n0 > n1) {
      const tmp = n1;
      n1 = n0;
      n0 = tmp;
    }

    n0 = Math.round(n0);
    n1 = Math.round(n1);
    const brushStart = this.ceil(Math.ceil(n0));
    const brushEnd = this.ceil(Math.ceil(n1));

    return [brushStart, brushEnd];
  }

  updateSingleSelection() {
    if (!this.singleEpochSelector.hidden) {
      console.assert(this.data.datapoints[this.singleEpochSelector.curPos].exists);
      TimelineParameters.singleIndex = this.singleEpochSelector.curPos;
      const cell = <MatrixCell | PanelCell> DataStoreCellSelection.getCell();
      // update index of selected cell so that detail view is updated properly
      if(cell !== null) {
        const index = this.data.datapoints
          .slice(0, this.singleEpochSelector.curPos)
          .filter((y) => y.exists).length;
        cell.data.heatcell.indexInMultiSelection[0] = index;
      }
    } else {
      TimelineParameters.singleIndex = -1;
    }
    DataStoreSelectedRun.updateRuns();
  }
}
