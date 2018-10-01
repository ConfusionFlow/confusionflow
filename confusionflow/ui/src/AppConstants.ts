/**
 * Created by Martin on 25.12.2017.
 */
export class AppConstants {

  /**
   * Static constant as identification for malevo views
   * Note: the string value is referenced for multiple view definitions in the package.json,
   *       i.e. be careful when refactor the value
   */
  static VIEW = 'malevoView';

  static EVENT_RESIZE = 'eventResize';

  /**
   * Fires when the user changes one of the timeline
   * @type {string}
   */
  static EVENT_TIMELINE_CHANGED = 'eventTimelineChanged';

  /**
   * Ids for different detail view tabs
   * @type {string}
   */
  static CHART_VIEW = 'chartView';
  static IMAGE_VIEW = 'imageView';
  static SOFTMAX_STAMP_VIEW = 'softmaxStampView';

  /**
   * Fires when the use selects a dataset from the selector
   * @type {string}
   */
  static EVENT_DATA_SET_ADDED = 'eventDataSetAdded';

  /**
   * Fires when the use unselects a dataset from the selector
   * @type {string}
   */
  static EVENT_DATA_SET_REMOVED = 'eventDataSetRemoved';


  /**
   * Fires when the detail view should be cleared
   */
  static CLEAR_CONF_MEASURES_VIEW = 'clearConfMeasuresView';

  /**
   * Fires when the confusion matrix has to be redrawn
   * @type {string}
   */
  static EVENT_REDRAW = 'eventRedraw';

  /**
   * Fires when a cell in the confusion matrix was selected
   * @type {string}
   */
  static EVENT_CELL_SELECTED = 'eventCellSelected';

  static EVENT_CLEAR_DETAIL_CHART = 'eventClarDetailChart';

  /**
   * Fires when the slider value changes
   * @type {string}
   */
  static EVENT_WEIGHT_FACTOR_CHANGED = 'eventWeightFactorChanged';

  /**
   * Fires when the matrix cell renderer should be transposed
   * @type {string}
   */
  static EVENT_CELL_RENDERER_TRANSPOSED = 'eventCellRendererTransposed';

  /**
   * Fires when the matrix cell renderer changed
   * @type {string}
   */
  static EVENT_CELL_RENDERER_CHANGED = 'eventCellRendererChanged';

  /**
   * Fires when y axis scale should be changed to absolute values
   * @type {string}
   */
  static EVENT_SWITCH_SCALE_TO_ABSOLUTE = 'eventSwitchScaleToAbsolute';

  /**
   * Fires when the selected class indicies are changed
   * @type {string}
   */
  static EVENT_CLASS_INDICES_CHANGED = 'eventClassIndicesChanged';

  /**
   * Fires when the selected cell is hovered and corresponding PanelCell is selected
   * @type {string}
   */
  static EVENT_MATRIX_CELL_HOVERED = 'eventMatrixCellHovered';

  /**
   * Fires when a new confusion measure should be rendered
   * @type {string}
   */
  static EVENT_RENDER_CONF_MEASURE = 'eventRenderConfMeasure';

  /**
   * Fires when the dataset has finished loading
   * @type {string}
   */
  static EVENT_LOADING_COMPLETE = 'eventLoadingComplete';

  /**
   * Represent the different cell types
   * @type {string}
   */
  static CELL_FP = 'cellFP';
  static CELL_FN = 'cellFN';
  static CELL_PRECISION = 'cellPrecision';
  static CELL_RECALL = 'cellRecall';
  static CELL_F1_SCORE = 'cellF1Score';
  static CELL_OVERALL_ACCURACY_SCORE = 'overallPrecisionScore';
  static CELL_CLASS_SIZE = 'cellClassSize';

  // Specifies how many dataset can be selected in the dataset selector at most
  static MAX_DATASET_COUNT = 4;

  /**
   * Number of rows and columns of the confusion matrix
   */
  static CONF_MATRIX_SIZE = 10;

  /**
   * Size of timeline components
   */
  static TML_HEIGHT = 35;

  /**
   * Color scale for heatmap cells
   * @type {[string,string]}
   */
  static BG_COLOR_SCALE = ['white', 'gray'];

  /**
   * Color Gray
   */
  static COLOR_GRAY = '#D3D3D3';
}
