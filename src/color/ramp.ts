import {rgb as d3rgb} from 'd3';

export function createColorRamp (cmap : number[][]) : any {
  const n = cmap.length;
  const cmapRGB = cmap
    .map((colors : number[]) => colors
      .map((float : number) => Math.max(0, Math.min(255, Math.floor(float * 256)))))
      .map((rgb : number[]) => d3rgb(rgb[0], rgb[1], rgb[2]));

  return function(float : number) {
    return cmapRGB[Math.max(0, Math.min(n - 1, Math.floor(float * n)))];
  };
}
