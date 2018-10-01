import {NumberMatrix, Matrix, matrixSum, SquareMatrix, IClassEvolution} from './DataStructures';

// Implements functions for confusion measures for 1 epoch and for multiple epochs
// Measures are from https://en.wikipedia.org/wiki/Confusion_matrix

export function ClassSize(matrix: NumberMatrix, index: number): number {
  if(index >= matrix.order()) {
    throw new Error('Invalid index');
  }
  return TP(matrix, index) + FP(matrix, index);
}

export function TP(matrix: NumberMatrix, index: number): number {
  if(index >= matrix.order()) {
    throw new Error('Invalid index');
  }
  return matrix.values[index][index];
}

export function FP(matrix: NumberMatrix, index: number): number {
  if(index >= matrix.order()) {
    throw new Error('Invalid index');
  }
  return matrix.values[index].reduce((acc, val) => acc + val, 0) - matrix.values[index][index];
}

export function FN(matrix: NumberMatrix, index: number): number {
  if(index >= matrix.order()) {
    throw new Error('Invalid index');
  }
  matrix = <SquareMatrix<number>> matrix.transpose();
  return matrix.values[index].reduce((acc, val) => acc + val, 0) - matrix.values[index][index];
}

export function TN(matrix: NumberMatrix, index: number): number {
  if(index >= matrix.order()) {
    throw new Error('Invalid index');
  }
  return matrixSum(matrix) - TP(matrix, index) - FP(matrix, index) - FN(matrix, index);
}

export function TPR(matrix: NumberMatrix, index: number): number {
  const denom = (TP(matrix, index) + FN(matrix, index));
  if(denom === 0) {
    return 0;
  }
  return TP(matrix, index) / denom;
}

export function ACC(matrix: NumberMatrix, index: number): number {
  const denom = (TP(matrix, index) + TN(matrix, index) + FP(matrix, index) + FN(matrix, index));
  if(denom === 0) {
    return 0;
  }
  return (TP(matrix, index) + TN(matrix, index)) / denom;
}

export function PPV(matrix: NumberMatrix, index: number): number {
  const denom = (TP(matrix, index) + FP(matrix, index));
  if(denom === 0) {
    return 0;
  }
  return TP(matrix, index) / denom;
}

export function F1(matrix: NumberMatrix, index: number): number {
  const denom = (PPV(matrix, index) + TPR(matrix, index));
  if(denom === 0) {
    return 0;
  }
  return 2 * ((PPV(matrix, index) * TPR(matrix, index)) / denom);
}

/**
 * Calculates confusion measures for multiple classes
 * Each class is mapped to one row in the matrix
 * @param matrix
 * @param funct
 * @returns {Array}
 */
export function calcForMultipleClasses(matrix: NumberMatrix, funct: (matrix: NumberMatrix, index: number) => number): number[] {
  const result = [];
  for(let i = 0; i < matrix.order(); i++) {
    result.push(funct(matrix, i));
  }
  return result;
}

/**
 * Calculates confusion measures for multiple epochs
 * @param matrices
 * @param funct
 * @returns {Matrix<number[]>}
 */
export function calcEvolution(matrices: NumberMatrix[], funct: (matrix: NumberMatrix, index: number) => number): Matrix<number[]> {
  const order = matrices[0].order();

  if(matrices.length === 0) {
    return new Matrix<number[]>(0, 0);
  }
  const matrix = new Matrix<number[]>(order, 1);
  const arr:number[][][] = [];
  for(let i = 0; i < order; i++) {
    arr[i] = [];
    arr[i][0] = [];
  }
  matrix.init(arr);

  for(const m of matrices) {
    const res = calcForMultipleClasses(m, funct);
    matrix.values.map((c, i) => c[0].push(res[i]));
  }
  return matrix;
}

export function calcOverallAccuracy(matrices: NumberMatrix[]): number[] {
  return matrices.map((m) => calcSummedPercent1(m));
}

export function calcSummedPercent1(matrix: NumberMatrix) {
  let tpSum = 0;
  let classSizeSum = 0;
  for(let i = 0; i < matrix.order(); i++) {
    tpSum += TP(matrix, i);
    classSizeSum += ClassSize(matrix, i);
  }
  if(classSizeSum === 0) {
    return 0;
  }
  return tpSum / classSizeSum;
}



