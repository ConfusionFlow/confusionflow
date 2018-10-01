import {hsl as d3hsl} from 'd3';
import * as d3 from 'd3';
import {IMalevoEpochInfo} from './MalevoDataset';
/**
 * Adapts the text color for a given background color
 * @param {string} bgColor as `#ff0000`
 * @returns {string} returns `black` or `white` for best contrast
 */
export function adaptTextColorToBgColor(bgColor: string, firstColor = 'black', secondColor = 'white'): string {
  return d3hsl(bgColor).l > 0.5 ? firstColor : secondColor;
}

export function createTooltip($parent: d3.Selection<any>, $node: d3.Selection<any>, textFunc: (d: any) => string) {
  // Prep the tooltip bits, initial display is hidden
  const tooltip = $parent.append('g')
    .classed('bar-tooltip', true)
    .style('display', 'none');

  tooltip.append('rect')
    .attr('width', 30)
    .attr('height', 20)
    .attr('fill', 'white');

  tooltip.append('text')
    .attr('x', 15)
    .attr('dy', '1.2em')
    .style('text-anchor', 'middle')
    .attr('font-size', '12px')
    .attr('font-weight', 'bold');


  $node.on('mouseover', function () {tooltip.style('display', null);})
    .on('mouseout', function () {tooltip.style('display', 'none');})
    .on('mousemove', function (d) {
      const xPosition = d3.mouse(this)[0] - 15;
      const yPosition = d3.mouse(this)[1] - 25;
      tooltip.attr('transform', 'translate(' + xPosition + ',' + yPosition + ')');
      tooltip.select('text').text(textFunc(d));
    });
}

/**
 * Extracts a positive integer from the epoch name string
 * @param {IMalevoEpochInfo} epoch
 * @returns {number} Returns -1 if no matching number found. Otherwise returns the integer.
 */
export function extractEpochId(epoch: IMalevoEpochInfo): number {
  const match = epoch.name.match(/[0-9]+/gi); // get a number
  if (match === null) {
    return -1;
  }
  return parseInt(match[0], 10);
}

/**
 * Zips array in form m[x:y] to form m[[x0, y0], [x1, y1], ...]
 * @param rows
 */
export function zip(rows: any[]): any[][] {
  if (rows.length === 0) {
    return [];
  }
  return rows[0].map((_, c) => rows.map((row) => row[c]));
}

export function simulateClick(elem /* Must be the element, not d3 selection */) {
    const evt = document.createEvent('MouseEvents');
    evt.initMouseEvent(
        'click', /* type */
        true, /* canBubble */
        true, /* cancelable */
        window, /* view */
        0, /* detail */
        0, /* screenX */
        0, /* screenY */
        0, /* clientX */
        0, /* clientY */
        false, /* ctrlKey */
        false, /* altKey */
        false, /* shiftKey */
        false, /* metaKey */
        0, /* button */
        null); /* relatedTarget */
    elem.dispatchEvent(evt);
}
