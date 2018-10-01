import * as events from 'phovea_core/src/event';
import {
  DataStoreSelectedRun, dataStoreRuns
} from '../DataStore';
import { ILoadedMalevoDataset, ILoadedMalevoEpoch, IMalevoEpochInfo, MalevoDataset } from '../MalevoDataset';
import { AppConstants } from '../AppConstants';
import { SquareMatrix } from '../DataStructures';
import { ITable } from 'phovea_core/src/table';
import * as confMeasures from '../ConfusionMeasures';


export function loadMatrixData(): Promise<ILoadedMalevoDataset[]> {
  const dataStoreTimelineArray = Array.from(dataStoreRuns.values()).sort((a, b) => a.selectionIndex - b.selectionIndex);
  // load the data range that is selected in the timeline + class labels; the color is part of the client is not save
  // at the server
  const allPromises: Promise<ILoadedMalevoDataset>[] = dataStoreTimelineArray.map((value: DataStoreSelectedRun) => {
    const loadDataPromises = [];
    loadDataPromises.push(loadEpochs(value.multiSelected, value.selectedDataset));
    if (value.singleSelected) {
      loadDataPromises.push(loadEpochs([value.singleSelected], value.selectedDataset));
    }
    loadDataPromises.push(value.selectedDataset.classLabels.data());
    loadDataPromises.push(Promise.resolve(value.color));
    loadDataPromises.push(value.selectedDataset.name);

    // when a runs is loaded...
    return Promise.all(loadDataPromises)
      .then((d: any[]): ILoadedMalevoDataset => { // [ILoadedMalevoEpoch[], ILoadedMalevoEpoch, string[]]
        // set labels and its ids
        const labels: string[] = d[2].map((x) => x[1]);
        const labelIds: number[] = d[2].map((x) => x[0]);

        dataStoreRuns.get(d[4]).isLoading = false;
        events.fire(AppConstants.EVENT_LOADING_COMPLETE);

        // create a run object and return it
        return <ILoadedMalevoDataset>{
          multiEpochData: <ILoadedMalevoEpoch[]>d[0],
          singleEpochData: <ILoadedMalevoEpoch>d[1][0],
          labels,
          labelIds,
          datasetColor: <string>d[3],
          classSizes: calcClassSizes(d)
        };
      });
  });

  // wait until datasets are loaded
  return Promise.all(allPromises);
}


function loadEpochs(matrix: IMalevoEpochInfo[], dataset: MalevoDataset): Promise<ILoadedMalevoEpoch[]> {
  if (matrix === null || matrix[0] === null) { // if a single epoch or multiepoch-range was deselected
    return Promise.resolve([]);
  }
  matrix = matrix.filter((epochInfo) => epochInfo !== null);
  const res = matrix.map((x) => {
    return x.confusionInfo.data();
  });
  return Promise.all(res).then((loadedEpochData: number[][][]) => {
    console.assert(loadedEpochData.length === matrix.length);
    if (loadedEpochData.length !== matrix.length) {
      throw new Error('The loaded epoch data does not conform with its description');
    }
    return loadedEpochData.map((val: number[][], index: number) => {
      const m = new SquareMatrix<number>(val.length);
      m.init(val);
      return { name: matrix[index].name, confusionData: m, id: matrix[index].id };
    });
  });
}

function loadLabels(table: ITable, dataset: MalevoDataset): Promise<string[]> {
  return table.data()
    .then((x: [[number, string]]) => {
      return x.map((x) => x[1]);
    });
}

function calcClassSizes(data: any) {
  if (data[0].length !== 0) {
    return confMeasures.calcForMultipleClasses(data[0][0].confusionData, confMeasures.ClassSize);
  } else if (data[1].length !== 0) {
    return confMeasures.calcForMultipleClasses(data[1][0].confusionData, confMeasures.ClassSize);
  }
  return null;
}
