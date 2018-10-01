import { mixin } from 'phovea_core/src';
import { INumberValueTypeDesc, VALUE_TYPE_REAL } from 'phovea_core/src/datatype';
import { INumericalMatrix } from 'phovea_core/src/matrix';
import { createDefaultMatrixDesc, IMatrixDataDescription, IMatrix } from 'phovea_core/src/matrix/IMatrix';
import { IMatrixLoader2 } from 'phovea_core/src/matrix/loader';
import Matrix from 'phovea_core/src/matrix/Matrix';
import { Range } from 'phovea_core/src/range';
import { asTableFromArray, ITable } from 'phovea_core/src/table';
import { Configuration, Dataset, Fold, Run, RunApi, FoldLog, DatasetApi, FoldLogData, FoldlogApi } from '../api';
import { IMalevoDatasetCollection, IMalevoEpochInfo, MalevoDataset } from '../MalevoDataset';
import { IDataProvider } from './api';


const API_CONFIGURATION: Configuration = new Configuration({
  basePath: '/api'
});

const datasetApi = new DatasetApi(API_CONFIGURATION);
const foldLogApi = new FoldlogApi(API_CONFIGURATION);
const runApi = new RunApi(API_CONFIGURATION);

export class SwaggerDataProvider implements IDataProvider {

  async load(): Promise<IMalevoDatasetCollection> {
    const datasets: Dataset[] = await datasetApi.getDatasets();

    const runs: Run[] = await runApi.getRuns();
    const dsc = {};

    runs.forEach((run: Run) => {
      const dataset: Dataset = datasets.filter((d) => d.folds.some((f) => f.foldId === run.trainfoldId))[0];
      // list each fold as malevo dataset
      run.foldlogs.forEach((foldLog, i) => {
        const ds = new LazyMalevoDatasetProxy(foldLog, dataset);
        dsc[ds.name] = ds;
      });
    });

    return dsc;
  }
}

/**
 * Proxy for MalevoDataset that retrieves the fold log data from Swagger.
 * Here we cache the loaded fold log data to avoid multiple API requests for the same run
 */
const foldLogDataCache = new Map<string, FoldLog>();

/**
 * Postpones loading the fold log data containing the epoch data until matrix.data() is called
 */
export class LazyMalevoDatasetProxy extends MalevoDataset {

  protected _classLabels: ITable;

  protected _epochInfos: IMalevoEpochInfo[];

  /**
   * cache promise to avoid multiple requests
   */
  private foldLogDataPromise: Promise<FoldLogData>;

  constructor(private foldLog: FoldLog, private dataset: Dataset) {
    super();
  }

  get name(): string {
    return this.foldLog.foldlogId;
  }

  get classLabels(): ITable {
    if (this._classLabels) {
      return this._classLabels;
    }

    return this.convertClassLabelsToTable(this.dataset);
  }

  /**
   * Override with a lazy matrix
   */
  get epochInfos(): IMalevoEpochInfo[] {
    if (this._epochInfos) {
      return this._epochInfos;
    }

    const epochs = new Array(this.foldLog.numepochs).fill(0);
    return epochs.map((_, i) => {
      return {
        id: i,
        name: i.toString(),
        confusionInfo: this.createLazyConfMatrix(i, this.dataset.numclass)
      };
    });
  }

  /**
   * Create a phovea matrix that loads the data on demand
   * @param epochId epoch id
   * @param numClass size of the confusion matrix
   */
  private createLazyConfMatrix(epochId: number, numClass: number): INumericalMatrix {
    const desc = mixin(createDefaultMatrixDesc(), {
      size: [numClass, numClass],
      value: <INumberValueTypeDesc>{ type: VALUE_TYPE_REAL, range: [0, 0] } // TODO set/update correct range
    });

    const loader: IMatrixLoader2<any> = {
      rowIds: (desc: IMatrixDataDescription<any>, range: Range) => Promise.reject('rowIds() not implemented'),
      colIds: (desc: IMatrixDataDescription<any>, range: Range) => Promise.reject('colIds() not implemented'),
      ids: (desc: IMatrixDataDescription<any>, range: Range) => {
        return Promise.reject('ids() not implemented');
      },
      at: (desc: IMatrixDataDescription<any>, i, j) => Promise.reject('at() not implemented'),
      rows: (desc: IMatrixDataDescription<any>, range: Range) => Promise.reject('rows() not implemented'),
      cols: (desc: IMatrixDataDescription<any>, range: Range) => Promise.reject('cols() not implemented'),
      data: (desc: IMatrixDataDescription<any>, range: Range) => this.loadFoldLogData().then((foldLogData: FoldLogData) => this.getConfMat(foldLogData, epochId, this.dataset.numclass))
    };

    return new Matrix(desc, loader);
  }

  /**
   * Load fold log data containing the epoch data
   * and cache the promise to avoid multiple network requests
   */
  private loadFoldLogData(): Promise<FoldLogData> {
    if (foldLogDataCache.has(this.foldLog.foldlogId)) {
      // check run cache first
      return Promise.resolve(foldLogDataCache.get(this.foldLog.foldlogId));
    } else if (this.foldLogDataPromise) {
      // check for promise, i.e., if some one else is already loading
      return this.foldLogDataPromise;
    }
    this.foldLogDataPromise = foldLogApi.getFoldLogDataById(this.foldLog.foldlogId)
      .then((foldLogData: FoldLogData) => {
        // add fold log data to cache to avoid multiple requests
        foldLogDataCache.set(foldLogData.foldlogId, foldLogData);
        return foldLogData;
      });
    return this.foldLogDataPromise;
  }

  /**
   * Retrieves a confusion matrix for a given epoch
   * @param run {Run}
   * @param epochId {number}
   */
  private getConfMat(foldLogData: FoldLogData, epochId: number, numClass: number): number[][] {
    return convertArray1DtoArray2D(foldLogData.epochdata[epochId].confmat, numClass);
  }

  private convertClassLabelsToTable(dataset: Dataset): ITable {
    const tableArray = [
      ['_id', 'class_id', 'class_labels'],
      ...dataset.classes.map((d, i) => {
        return [i, i, d];
      })
    ];
    const table = asTableFromArray(tableArray, { keyProperty: 'class_id' });
    return table;
  }

}


/**
 * Converts an input 1D array to an 2D array, by wrapping it after a specific number of items
 * @param array1d Input array
 * @param wrapAfter {number} Wrap after x items
 */
function convertArray1DtoArray2D(array1d: number[], wrapAfter: number): number[][] {
  const array2d = [];
  const array1dCopy = array1d.slice();
  while (array1dCopy.length) {
    array2d.push(array1dCopy.splice(0, wrapAfter));
  }
  return array2d;
}
