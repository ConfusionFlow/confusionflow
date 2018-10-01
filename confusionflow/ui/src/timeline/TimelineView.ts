/**
 * Created by Martin on 11.03.2018.
 */
import * as d3 from 'd3';
import * as events from 'phovea_core/src/event';
import {AppConstants} from '../AppConstants';
import {MalevoDataset} from '../MalevoDataset';
import {IAppView} from '../app';
import {Timeline, TimelineData} from './Timeline';
import {dataStoreRuns} from '../DataStore';

export default class TimelineView implements IAppView {
  private readonly $node: d3.Selection<any>;
  private width: number;
  private readonly padding = 10;

  private timeline: Timeline = null;

  constructor(parent: Element) {
    this.width = parent.clientWidth;
    this.$node = d3.select(parent)
      .append('svg')
      .classed('timeline-view', true)
      .attr('width', '100%')
      .attr('height', '0px')
      .attr('viewBox', `0 0 ${this.width} 0`);
  }

  updateSvg(timeLineCount: number, maxWidth: number) {
    this.$node.attr('viewBox', `0 0 ${Math.max(this.width, maxWidth) + this.padding} ${(timeLineCount) * AppConstants.TML_HEIGHT}`);
    this.$node.attr('height', '100%');
    this.$node.classed('hidden', timeLineCount === 0);
  }

  private attachListener() {
    events.on(AppConstants.EVENT_DATA_SET_ADDED, (evt, ds: MalevoDataset) => {
      if (this.timeline === null) {
        const marginLabelTimeline = 10; // 10 pixel margin between label and timeline
        const tmData = new TimelineData(ds.epochInfos);
        this.timeline = new Timeline(ds.name, this.$node);
        this.timeline.data = tmData;
        this.timeline.render(this.$node, marginLabelTimeline, 0);
        this.updateSvg(1, this.timeline.getWidth());
        this.width = this.timeline.getWidth();
      }
    });

    events.on(AppConstants.EVENT_DATA_SET_REMOVED, (evt, ds: MalevoDataset) => {
      if (dataStoreRuns.size === 0) {
        this.timeline.node().remove();
        this.updateSvg(0, this.width);
        this.timeline = null;
      }
    });
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
}

/**
 * Factory method to create a new HeatMap instance
 * @param parent
 * @param options
 * @returns {HeatMap}
 */
export function create(parent: Element, options: any) {
  return new TimelineView(parent);
}
