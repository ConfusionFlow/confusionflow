import { IMalevoDatasetCollection } from '../MalevoDataset';

export interface IDataProvider {
  load(): Promise<IMalevoDatasetCollection>;
}
