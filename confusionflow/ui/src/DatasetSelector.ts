/**
 * Created by Holger Stitz on 26.08.2016.
 */

import 'select2';
import { AppConstants } from './AppConstants';
import { IAppView } from './app';
import { Language } from './language';
import * as d3 from 'd3';
import { MalevoDataset, IMalevoDatasetCollection } from './MalevoDataset';
import * as $ from 'jquery';
import { DataStoreSelectedRun, dataStoreRuns } from './DataStore';
import * as events from 'phovea_core/src/event';
import { dataProviderFactory } from './data_provider';

/**
 * Shows a list of available datasets and lets the user choose one.
 * The selection is broadcasted as event throughout the application.
 */
class DataSetSelector implements IAppView {

  private $node;
  private $select;
  private select2Options = {
    maximumSelectionLength: AppConstants.MAX_DATASET_COUNT,
    placeholder: Language.DATASET_SELECTOR_PLACEHOLDER
  };

  constructor() {
    this.$node = d3.select('.navbar-header')
      .append('div')
      .classed('dataSelector', true)
      .append('form')
      .classed('form-inline', true)
      .append('div')
      .classed('form-group', true)
      .classed('hidden', true); // show after loading has finished
  }

  /**
   * Initialize the view and return a promise
   * that is resolved as soon the view is completely initialized.
   * @returns {Promise<DataSetSelector>}
   */
  init() {
    this.build();
    this.attachListeners();
    return this.update(); // return the promise
  }

  private attachListeners() {
    events.on(AppConstants.EVENT_LOADING_COMPLETE, (evt, ds: MalevoDataset) => {
      this.updateLoadingState();
    });
  }

  /**
   * Build the basic DOM elements and binds the change function
   * Uses select2 in order to create and remove runs
   */
  private build() {
    this.$node.html(`
      <select id="dataset-selector" multiple="multiple" style="width:70vw">
      </select> `);

    this.$select = this.$node.select('#dataset-selector');

    const that = this;
    (<any>$(this.$select.node()))
      .select2(this.select2Options)
      .on('select2:open', (evt) => {
        setTimeout(() => {
          that.updateSelectorColors(d3.selectAll('li.select2-results__option[aria-selected="true"]'), (el: HTMLElement) => el.innerText);
        }, 10); // wait until select2 generated the result list
      })
      .on('select2:select', (evt) => {
        const dataset = d3.select(evt.params.data.element).data()[0];
        DataStoreSelectedRun.add(dataset);
        that.updateSelectorColors();
        that.updateLoadingState();
      })
      .on('select2:unselect', (evt) => {
        const dataset = d3.select(evt.params.data.element).data()[0];
        DataStoreSelectedRun.remove(dataset);
        that.updateSelectorColors();
        that.updateLoadingState();
      });
  }

  private updateLoadingState() {
    this.$node.selectAll('li.select2-selection__choice')
      .each(function () {
        const d = d3.select(this);
        const dataset = dataStoreRuns.get(d.attr('title'));
        if (dataset.isLoading) {
          d.style('--blinking-color', dataset.color);
          d.classed('loading', true);
        } else {
          d.classed('loading', false);
        }
      });
  }

  /**
   * Sets the color to a new added run
   * @param selection
   * @param attrFunc
   */
  private updateSelectorColors(selection = this.$node.selectAll('li.select2-selection__choice'), attrFunc = (el: HTMLElement) => el.title) {
    selection[0]
      .forEach((d, i) => {
        const timeline = dataStoreRuns.get(attrFunc(d));
        // set background to dataset color with opacity of 0.1
        d3.select(d).style('background-color', timeline.color + '19');
      });
  }

  /**
   * Update the list of datasets and returns a promise
   * @returns {Promise<DataSetSelector>}
   */
  private update() {
    return dataProviderFactory().load()
      .then((data: IMalevoDatasetCollection) => {
        const resultArray = Object.keys(data).map((index) => data[index]);

        const $options = this.$select.selectAll('option').data(resultArray);

        $options.enter().append('option');

        $options
          .attr('value', (d) => d.name)
          .text((d) =>
            `${d.name}`
          );

        $options.exit().remove();
        this.$node.classed('hidden', false);

        // set initial dataset
        if (Object.keys(data).length > 0) {
          const x = data[Object.keys(data)[0]];
          $('#dataset-selector').select2(this.select2Options).val(x.name).trigger('change');
          DataStoreSelectedRun.add(x);
          this.updateSelectorColors();
          this.updateLoadingState();
        }
        return this;
      });
  }

}

/**
 * Factory method to create a new DataSetSelector instance
 * @param parent
 * @param options
 * @returns {DataSetSelector}
 */
export function create(parent: Element, options: any) {
  return new DataSetSelector();
}
