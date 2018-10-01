import {INumericalMatrix} from 'phovea_core/src/matrix';
import {ITable} from 'phovea_core/src/table';
import {SquareMatrix} from './DataStructures';

/**
 * Stores data of a single epoch
 */
export interface IMalevoEpochInfo {
  name: string;
  confusionInfo: INumericalMatrix;
  id: number;
}

/**
 * A whole dataset which consists of 1..n epochs
 */
export class MalevoDataset {
  name: string;
  epochInfos: IMalevoEpochInfo[];
  classLabels: ITable;
}

/**
 * A collection of multiple datasets
 */
export interface IMalevoDatasetCollection {
  [key: string]: MalevoDataset;
}

/**
 * Data that was loaded from the server for a single epoch
 */
export interface ILoadedMalevoEpoch {
  name: string;
  confusionData: SquareMatrix<number>;
  id: number;
}

/**
 * Represents the current status of a single timeline
 */
export interface ILoadedMalevoDataset {
  datasetColor: string;
  singleEpochData: ILoadedMalevoEpoch;
  multiEpochData: ILoadedMalevoEpoch[];
  labels: string[];
  labelIds: number[];
  classSizes: number[];
}
