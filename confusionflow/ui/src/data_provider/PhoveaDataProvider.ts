import * as data from 'phovea_core/src/data';
import { INumericalMatrix } from 'phovea_core/src/matrix';
import { ITable } from 'phovea_core/src/table';
import { extractEpochId } from '../utils';
import { MalevoDataset, IMalevoDatasetCollection, IMalevoEpochInfo } from '../MalevoDataset';
import { IDataProvider } from './api';

/**
 * Loads the descriptors from the server
 * and creates the malevo data structures
 */
export class PhoveaDataProvider implements IDataProvider {
  /**
   * Loads the data and retruns a promise
   * @returns {Promise<MalevoDataset[]>}
   */
  load(): Promise<IMalevoDatasetCollection> {
    const promMatrix = data
      .list({ 'type': 'matrix' }) // use server-side filtering
      .then((list: INumericalMatrix[]) => {
        return this.prepareEpochData(list);
      });
    const promTable = data
      .list({ 'type': 'table' })
      .then((list: ITable[]) => {
        return this.prepareClassLabels(list);
      });

    return Promise.all([promMatrix, promTable]).then((results: any) => {
      const dsc: IMalevoDatasetCollection = results[0];
      const tables = results[1];

      for (const key of Object.keys(tables)) {
        dsc[key].classLabels = tables[key];
      }
      return dsc;
    });
  }

  /**
   * Extracts the epoch id from the descriptor and returns a sorting criteria
   * @param dsc
   */
  private fillMissingEpochs(dsc: IMalevoDatasetCollection) {
    function sortNumber(a: IMalevoEpochInfo, b: IMalevoEpochInfo) {
      if (a === null && b === null) {
        return null;
      } else if (a === null) {
        return extractEpochId(b);
      } else if (b === null) {
        return extractEpochId(a);
      }
      return extractEpochId(a) - extractEpochId(b);
    }

    Object.values(dsc).forEach((dataset: MalevoDataset) => {
      const epochs = dataset.epochInfos;
      epochs.sort(sortNumber);
      const newEpochs = [];
      const length = epochs[epochs.length - 1].id;
      for (let i = 0; i <= length; i++) {
        const epoch = epochs.find((x) => x.id === i);
        const dp = epoch ? epoch : null;
        newEpochs.push(dp);
      }
      dataset.epochInfos = newEpochs;
    });
  }

  /**
   * Returns a collection of available labels
   * @param data
   * @returns {{[p: string]: ITable}}
   */
  private prepareClassLabels(data: ITable[]): { [key: string]: ITable } {
    const labelCollection: { [key: string]: ITable } = {};
    for (const x of data) {
      const parts = this.getDatasetName(x);
      labelCollection[parts[0]] = x;
    }
    return labelCollection;
  }

  /**
   * Creates a new malevo dataset if it doesn't exist so far
   * @param data
   * @returns {IMalevoDatasetCollection}
   */
  private prepareEpochData(data: INumericalMatrix[]): IMalevoDatasetCollection {
    const getOrCreateMalevoDataset = (dsc: IMalevoDatasetCollection, datasetName: string) => {
      if (!dsc[datasetName]) {
        const ds = new MalevoDataset();
        ds.name = datasetName;
        ds.epochInfos = [];
        dsc[datasetName] = ds;
        return ds;
      }
      return dsc[datasetName];
    };

    /**
     * Returns a new epoch info if it doesn't exist for this dataset
     * @param dataset
     * @param epochName
     * @returns {IMalevoEpochInfo}
     */
    const getOrCreateEpochInfo = (dataset: MalevoDataset, epochName: string) => {
      let epochInfo = dataset.epochInfos.find((x) => x.name === epochName);
      if (!epochInfo) {
        epochInfo = { name: epochName, confusionInfo: null, id: null };
        epochInfo.id = extractEpochId(epochInfo);
        dataset.epochInfos.push(epochInfo);
        return epochInfo;
      }
      return epochInfo;
    };

    const dsc: IMalevoDatasetCollection = {};

    for (const x of data) {
      try {
        const parts = this.getDatasetName(x);
        const dataset = getOrCreateMalevoDataset(dsc, parts[0]);
        const epochInfo: IMalevoEpochInfo = getOrCreateEpochInfo(dataset, parts[2]);
        epochInfo.confusionInfo = x;
      } catch (e) {
        // handle invalid server response data here
      }

    }
    this.fillMissingEpochs(dsc);
    return dsc;
  }

  private getDatasetName(x: INumericalMatrix | ITable) {
    const parts = x.desc.name.split('-');
    if (parts.length < 2 || parts.length > 4) {
      throw new Error('The received filename is not valid');
    }
    return parts;
  }
}
