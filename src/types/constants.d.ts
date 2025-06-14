export const APP_NAME = "LexOS";
export const APP_VERSION = "1.0.0";

export const MAX_METRICS_HISTORY = 100;
export const METRICS_UPDATE_INTERVAL = 1000;
export const COMMAND_HISTORY_LIMIT = 50;

export const AGENT_STATUS_COLORS = {
  idle: "bg-gray-500",
  running: "bg-green-500",
  error: "bg-red-500",
} as const;

export const AGENT_STATUS_LABELS = {
  idle: "Idle",
  running: "Running",
  error: "Error",
} as const;

export const COMMAND_STATUS_COLORS = {
  pending: "bg-gray-500",
  running: "bg-blue-500",
  completed: "bg-green-500",
  error: "bg-red-500",
} as const;

export const COMMAND_STATUS_LABELS = {
  pending: "Pending",
  running: "Running",
  completed: "Completed",
  error: "Error",
} as const;

export const METRICS_COLORS = {
  cpu: "bg-blue-500",
  memory: "bg-green-500",
  gpu: "bg-purple-500",
} as const;

export const METRICS_LABELS = {
  cpu: "CPU",
  memory: "Memory",
  gpu: "GPU",
} as const;

export const WORKFLOW_NODE_TYPES = {
  agent: "agent",
} as const;

export const WORKFLOW_EDGE_TYPES = {
  smoothstep: "smoothstep",
} as const;

export const WORKFLOW_LAYOUT_OPTIONS = {
  rankdir: "TB",
  align: "UL",
  ranker: "network-simplex",
  nodesep: 50,
  ranksep: 50,
} as const;

export const WORKFLOW_DEFAULT_NODE_POSITION = {
  x: 0,
  y: 0,
} as const;

export const WORKFLOW_DEFAULT_EDGE_STYLE = {
  stroke: "#64748b",
} as const;

export const WORKFLOW_DEFAULT_EDGE_ANIMATED = true;

export const WORKFLOW_DEFAULT_EDGE_TYPE = "smoothstep";

export const WORKFLOW_DEFAULT_NODE_TYPE = "agent";

export const WORKFLOW_DEFAULT_NODE_WIDTH = 200;

export const WORKFLOW_DEFAULT_NODE_HEIGHT = 100;

export const WORKFLOW_DEFAULT_NODE_PADDING = 16;

export const WORKFLOW_DEFAULT_EDGE_STROKE_WIDTH = 2;

export const WORKFLOW_DEFAULT_EDGE_STROKE_DASHARRAY = "5,5";

export const WORKFLOW_DEFAULT_EDGE_STROKE_DASHOFFSET = 0;

export const WORKFLOW_DEFAULT_EDGE_STROKE_LINECAP = "round";

export const WORKFLOW_DEFAULT_EDGE_STROKE_LINEJOIN = "round";

export const WORKFLOW_DEFAULT_EDGE_STROKE_MITERLIMIT = 10;

export const WORKFLOW_DEFAULT_EDGE_STROKE_OPACITY = 1;

export const WORKFLOW_DEFAULT_EDGE_STROKE_DASHARRAY_ANIMATED = "5,5";

export const WORKFLOW_DEFAULT_EDGE_STROKE_DASHOFFSET_ANIMATED = 0;

export const WORKFLOW_DEFAULT_EDGE_STROKE_DASHARRAY_STATIC = "none";

export const WORKFLOW_DEFAULT_EDGE_STROKE_DASHOFFSET_STATIC = 0;

export const WORKFLOW_DEFAULT_EDGE_STROKE_DASHARRAY_ERROR = "5,5";

export const WORKFLOW_DEFAULT_EDGE_STROKE_DASHOFFSET_ERROR = 0;

export const WORKFLOW_DEFAULT_EDGE_STROKE_DASHARRAY_SUCCESS = "none";

export const WORKFLOW_DEFAULT_EDGE_STROKE_DASHOFFSET_SUCCESS = 0;

export const WORKFLOW_DEFAULT_EDGE_STROKE_DASHARRAY_WARNING = "5,5";

export const WORKFLOW_DEFAULT_EDGE_STROKE_DASHOFFSET_WARNING = 0;

export const WORKFLOW_DEFAULT_EDGE_STROKE_DASHARRAY_INFO = "5,5";

export const WORKFLOW_DEFAULT_EDGE_STROKE_DASHOFFSET_INFO = 0;

export const WORKFLOW_DEFAULT_EDGE_STROKE_DASHARRAY_DEBUG = "5,5";

export const WORKFLOW_DEFAULT_EDGE_STROKE_DASHOFFSET_DEBUG = 0;

export const WORKFLOW_DEFAULT_EDGE_STROKE_DASHARRAY_TRACE = "5,5";

export const WORKFLOW_DEFAULT_EDGE_STROKE_DASHOFFSET_TRACE = 0;

export const WORKFLOW_DEFAULT_EDGE_STROKE_DASHARRAY_VERBOSE = "5,5";

export const WORKFLOW_DEFAULT_EDGE_STROKE_DASHOFFSET_VERBOSE = 0;

export const WORKFLOW_DEFAULT_EDGE_STROKE_DASHARRAY_SILLY = "5,5";

export const WORKFLOW_DEFAULT_EDGE_STROKE_DASHOFFSET_SILLY = 0;

export const WORKFLOW_DEFAULT_EDGE_STROKE_DASHARRAY_FATAL = "5,5";

export const WORKFLOW_DEFAULT_EDGE_STROKE_DASHOFFSET_FATAL = 0;

export const WORKFLOW_DEFAULT_EDGE_STROKE_DASHARRAY_ERROR_FATAL = "5,5";

export const WORKFLOW_DEFAULT_EDGE_STROKE_DASHOFFSET_ERROR_FATAL = 0;

export const WORKFLOW_DEFAULT_EDGE_STROKE_DASHARRAY_ERROR_WARNING = "5,5";

export const WORKFLOW_DEFAULT_EDGE_STROKE_DASHOFFSET_ERROR_WARNING = 0;

export const WORKFLOW_DEFAULT_EDGE_STROKE_DASHARRAY_ERROR_INFO = "5,5";

export const WORKFLOW_DEFAULT_EDGE_STROKE_DASHOFFSET_ERROR_INFO = 0;

export const WORKFLOW_DEFAULT_EDGE_STROKE_DASHARRAY_ERROR_DEBUG = "5,5";

export const WORKFLOW_DEFAULT_EDGE_STROKE_DASHOFFSET_ERROR_DEBUG = 0;

export const WORKFLOW_DEFAULT_EDGE_STROKE_DASHARRAY_ERROR_TRACE = "5,5";

export const WORKFLOW_DEFAULT_EDGE_STROKE_DASHOFFSET_ERROR_TRACE = 0;

export const WORKFLOW_DEFAULT_EDGE_STROKE_DASHARRAY_ERROR_VERBOSE = "5,5";

export const WORKFLOW_DEFAULT_EDGE_STROKE_DASHOFFSET_ERROR_VERBOSE = 0;

export const WORKFLOW_DEFAULT_EDGE_STROKE_DASHARRAY_ERROR_SILLY = "5,5";

export const WORKFLOW_DEFAULT_EDGE_STROKE_DASHOFFSET_ERROR_SILLY = 0;

export const WORKFLOW_DEFAULT_EDGE_STROKE_DASHARRAY_WARNING_FATAL = "5,5";

export const WORKFLOW_DEFAULT_EDGE_STROKE_DASHOFFSET_WARNING_FATAL = 0;

export const WORKFLOW_DEFAULT_EDGE_STROKE_DASHARRAY_WARNING_ERROR = "5,5";

export const WORKFLOW_DEFAULT_EDGE_STROKE_DASHOFFSET_WARNING_ERROR = 0;

export const WORKFLOW_DEFAULT_EDGE_STROKE_DASHARRAY_WARNING_INFO = "5,5";

export const WORKFLOW_DEFAULT_EDGE_STROKE_DASHOFFSET_WARNING_INFO = 0;

export const WORKFLOW_DEFAULT_EDGE_STROKE_DASHARRAY_WARNING_DEBUG = "5,5";

export const WORKFLOW_DEFAULT_EDGE_STROKE_DASHOFFSET_WARNING_DEBUG = 0;

export const WORKFLOW_DEFAULT_EDGE_STROKE_DASHARRAY_WARNING_TRACE = "5,5";

export const WORKFLOW_DEFAULT_EDGE_STROKE_DASHOFFSET_WARNING_TRACE = 0;

export const WORKFLOW_DEFAULT_EDGE_STROKE_DASHARRAY_WARNING_VERBOSE = "5,5";

export const WORKFLOW_DEFAULT_EDGE_STROKE_DASHOFFSET_WARNING_VERBOSE = 0;

export const WORKFLOW_DEFAULT_EDGE_STROKE_DASHARRAY_WARNING_SILLY = "5,5";

export const WORKFLOW_DEFAULT_EDGE_STROKE_DASHOFFSET_WARNING_SILLY = 0;

export const WORKFLOW_DEFAULT_EDGE_STROKE_DASHARRAY_INFO_FATAL = "5,5";

export const WORKFLOW_DEFAULT_EDGE_STROKE_DASHOFFSET_INFO_FATAL = 0;

export const WORKFLOW_DEFAULT_EDGE_STROKE_DASHARRAY_INFO_ERROR = "5,5";

export const WORKFLOW_DEFAULT_EDGE_STROKE_DASHOFFSET_INFO_ERROR = 0;

export const WORKFLOW_DEFAULT_EDGE_STROKE_DASHARRAY_INFO_WARNING = "5,5";

export const WORKFLOW_DEFAULT_EDGE_STROKE_DASHOFFSET_INFO_WARNING = 0;

export const WORKFLOW_DEFAULT_EDGE_STROKE_DASHARRAY_INFO_DEBUG = "5,5";

export const WORKFLOW_DEFAULT_EDGE_STROKE_DASHOFFSET_INFO_DEBUG = 0;

export const WORKFLOW_DEFAULT_EDGE_STROKE_DASHARRAY_INFO_TRACE = "5,5";

export const WORKFLOW_DEFAULT_EDGE_STROKE_DASHOFFSET_INFO_TRACE = 0;

export const WORKFLOW_DEFAULT_EDGE_STROKE_DASHARRAY_INFO_VERBOSE = "5,5";

export const WORKFLOW_DEFAULT_EDGE_STROKE_DASHOFFSET_INFO_VERBOSE = 0;

export const WORKFLOW_DEFAULT_EDGE_STROKE_DASHARRAY_INFO_SILLY = "5,5";

export const WORKFLOW_DEFAULT_EDGE_STROKE_DASHOFFSET_INFO_SILLY = 0;

export const WORKFLOW_DEFAULT_EDGE_STROKE_DASHARRAY_DEBUG_FATAL = "5,5";

export const WORKFLOW_DEFAULT_EDGE_STROKE_DASHOFFSET_DEBUG_FATAL = 0;

export const WORKFLOW_DEFAULT_EDGE_STROKE_DASHARRAY_DEBUG_ERROR = "5,5";

export const WORKFLOW_DEFAULT_EDGE_STROKE_DASHOFFSET_DEBUG_ERROR = 0;

export const WORKFLOW_DEFAULT_EDGE_STROKE_DASHARRAY_DEBUG_WARNING = "5,5";

export const WORKFLOW_DEFAULT_EDGE_STROKE_DASHOFFSET_DEBUG_WARNING = 0;

export const WORKFLOW_DEFAULT_EDGE_STROKE_DASHARRAY_DEBUG_INFO = "5,5";

export const WORKFLOW_DEFAULT_EDGE_STROKE_DASHOFFSET_DEBUG_INFO = 0;

export const WORKFLOW_DEFAULT_EDGE_STROKE_DASHARRAY_DEBUG_TRACE = "5,5";

export const WORKFLOW_DEFAULT_EDGE_STROKE_DASHOFFSET_DEBUG_TRACE = 0;

export const WORKFLOW_DEFAULT_EDGE_STROKE_DASHARRAY_DEBUG_VERBOSE = "5,5";

export const WORKFLOW_DEFAULT_EDGE_STROKE_DASHOFFSET_DEBUG_VERBOSE = 0;

export const WORKFLOW_DEFAULT_EDGE_STROKE_DASHARRAY_DEBUG_SILLY = "5,5";

export const WORKFLOW_DEFAULT_EDGE_STROKE_DASHOFFSET_DEBUG_SILLY = 0;

export const WORKFLOW_DEFAULT_EDGE_STROKE_DASHARRAY_TRACE_FATAL = "5,5";

export const WORKFLOW_DEFAULT_EDGE_STROKE_DASHOFFSET_TRACE_FATAL = 0;

export const WORKFLOW_DEFAULT_EDGE_STROKE_DASHARRAY_TRACE_ERROR = "5,5";

export const WORKFLOW_DEFAULT_EDGE_STROKE_DASHOFFSET_TRACE_ERROR = 0;

export const WORKFLOW_DEFAULT_EDGE_STROKE_DASHARRAY_TRACE_WARNING = "5,5";

export const WORKFLOW_DEFAULT_EDGE_STROKE_DASHOFFSET_TRACE_WARNING = 0;

export const WORKFLOW_DEFAULT_EDGE_STROKE_DASHARRAY_TRACE_INFO = "5,5";

export const WORKFLOW_DEFAULT_EDGE_STROKE_DASHOFFSET_TRACE_INFO = 0;

export const WORKFLOW_DEFAULT_EDGE_STROKE_DASHARRAY_TRACE_DEBUG = "5,5";

export const WORKFLOW_DEFAULT_EDGE_STROKE_DASHOFFSET_TRACE_DEBUG = 0;

export const WORKFLOW_DEFAULT_EDGE_STROKE_DASHARRAY_TRACE_VERBOSE = "5,5";

export const WORKFLOW_DEFAULT_EDGE_STROKE_DASHOFFSET_TRACE_VERBOSE = 0;

export const WORKFLOW_DEFAULT_EDGE_STROKE_DASHARRAY_TRACE_SILLY = "5,5";

export const WORKFLOW_DEFAULT_EDGE_STROKE_DASHOFFSET_TRACE_SILLY = 0;

export const WORKFLOW_DEFAULT_EDGE_STROKE_DASHARRAY_VERBOSE_FATAL = "5,5";

export const WORKFLOW_DEFAULT_EDGE_STROKE_DASHOFFSET_VERBOSE_FATAL = 0;

export const WORKFLOW_DEFAULT_EDGE_STROKE_DASHARRAY_VERBOSE_ERROR = "5,5";

export const WORKFLOW_DEFAULT_EDGE_STROKE_DASHOFFSET_VERBOSE_ERROR = 0;

export const WORKFLOW_DEFAULT_EDGE_STROKE_DASHARRAY_VERBOSE_WARNING = "5,5";

export const WORKFLOW_DEFAULT_EDGE_STROKE_DASHOFFSET_VERBOSE_WARNING = 0;

export const WORKFLOW_DEFAULT_EDGE_STROKE_DASHARRAY_VERBOSE_INFO = "5,5";

export const WORKFLOW_DEFAULT_EDGE_STROKE_DASHOFFSET_VERBOSE_INFO = 0;

export const WORKFLOW_DEFAULT_EDGE_STROKE_DASHARRAY_VERBOSE_DEBUG = "5,5";

export const WORKFLOW_DEFAULT_EDGE_STROKE_DASHOFFSET_VERBOSE_DEBUG = 0;

export const WORKFLOW_DEFAULT_EDGE_STROKE_DASHARRAY_VERBOSE_TRACE = "5,5";

export const WORKFLOW_DEFAULT_EDGE_STROKE_DASHOFFSET_VERBOSE_TRACE = 0;

export const WORKFLOW_DEFAULT_EDGE_STROKE_DASHARRAY_VERBOSE_SILLY = "5,5";

export const WORKFLOW_DEFAULT_EDGE_STROKE_DASHOFFSET_VERBOSE_SILLY = 0;

export const WORKFLOW_DEFAULT_EDGE_STROKE_DASHARRAY_SILLY_FATAL = "5,5";

export const WORKFLOW_DEFAULT_EDGE_STROKE_DASHOFFSET_SILLY_FATAL = 0;

export const WORKFLOW_DEFAULT_EDGE_STROKE_DASHARRAY_SILLY_ERROR = "5,5";

export const WORKFLOW_DEFAULT_EDGE_STROKE_DASHOFFSET_SILLY_ERROR = 0;

export const WORKFLOW_DEFAULT_EDGE_STROKE_DASHARRAY_SILLY_WARNING = "5,5";

export const WORKFLOW_DEFAULT_EDGE_STROKE_DASHOFFSET_SILLY_WARNING = 0;

export const WORKFLOW_DEFAULT_EDGE_STROKE_DASHARRAY_SILLY_INFO = "5,5";

export const WORKFLOW_DEFAULT_EDGE_STROKE_DASHOFFSET_SILLY_INFO = 0;

export const WORKFLOW_DEFAULT_EDGE_STROKE_DASHARRAY_SILLY_DEBUG = "5,5";

export const WORKFLOW_DEFAULT_EDGE_STROKE_DASHOFFSET_SILLY_DEBUG = 0;

export const WORKFLOW_DEFAULT_EDGE_STROKE_DASHARRAY_SILLY_TRACE = "5,5";

export const WORKFLOW_DEFAULT_EDGE_STROKE_DASHOFFSET_SILLY_TRACE = 0;

export const WORKFLOW_DEFAULT_EDGE_STROKE_DASHARRAY_SILLY_VERBOSE = "5,5";

export const WORKFLOW_DEFAULT_EDGE_STROKE_DASHOFFSET_SILLY_VERBOSE = 0;

export const WORKFLOW_DEFAULT_EDGE_STROKE_DASHARRAY_SILLY_FATAL = "5,5";

export const WORKFLOW_DEFAULT_EDGE_STROKE_DASHOFFSET_SILLY_FATAL = 0;

export const WORKFLOW_DEFAULT_EDGE_STROKE_DASHARRAY_FATAL_ERROR = "5,5";

export const WORKFLOW_DEFAULT_EDGE_STROKE_DASHOFFSET_FATAL_ERROR = 0;

export const WORKFLOW_DEFAULT_EDGE_STROKE_DASHARRAY_FATAL_WARNING = "5,5";

export const WORKFLOW_DEFAULT_EDGE_STROKE_DASHOFFSET_FATAL_WARNING = 0;

export const WORKFLOW_DEFAULT_EDGE_STROKE_DASHARRAY_FATAL_INFO = "5,5";

export const WORKFLOW_DEFAULT_EDGE_STROKE_DASHOFFSET_FATAL_INFO = 0;

export const WORKFLOW_DEFAULT_EDGE_STROKE_DASHARRAY_FATAL_DEBUG = "5,5";

export const WORKFLOW_DEFAULT_EDGE_STROKE_DASHOFFSET_FATAL_DEBUG = 0;

export const WORKFLOW_DEFAULT_EDGE_STROKE_DASHARRAY_FATAL_TRACE = "5,5";

export const WORKFLOW_DEFAULT_EDGE_STROKE_DASHOFFSET_FATAL_TRACE = 0;

export const WORKFLOW_DEFAULT_EDGE_STROKE_DASHARRAY_FATAL_VERBOSE = "5,5";

export const WORKFLOW_DEFAULT_EDGE_STROKE_DASHOFFSET_FATAL_VERBOSE = 0;

export const WORKFLOW_DEFAULT_EDGE_STROKE_DASHARRAY_FATAL_SILLY = "5,5";

export const WORKFLOW_DEFAULT_EDGE_STROKE_DASHOFFSET_FATAL_SILLY = 0;

export const WORKFLOW_DEFAULT_EDGE_STROKE_DASHARRAY_FATAL_FATAL = "5,5";

export const WORKFLOW_DEFAULT_EDGE_STROKE_DASHOFFSET_FATAL_FATAL = 0; 