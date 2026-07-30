export const VIEWBOX = { x: 0, y: 0, width: 100, height: 100 }

export const DEFAULT_LINE_COLOR = '#6366f1'
export const DEFAULT_LINE_WIDTH = 2

export const POINT_STYLES = [
  { value: 'none', label: 'None' },
  { value: 'dot', label: 'Dot' },
  { value: 'arrow', label: 'Arrow' }
]

export const LINE_WIDTH_OPTIONS = [1, 2, 3, 4, 5, 6, 8, 10]

export const TOOL_LABELS = {
  line: 'Line',
  polyline: 'Polyline'
}

export const TOOL_DESCRIPTIONS = {
  line: 'Click twice to draw a line',
  polyline: 'Click multiple times to draw, double-click to finish'
}

export const SVG_MARKER_DEFS = `  <defs>\n    <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">\n      <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e5e7eb" stroke-width="0.5"/>\n    </pattern>\n    <marker id="marker-dot" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto" markerUnits="strokeWidth">\n      <circle cx="3" cy="3" r="2" fill="currentColor"/>\n    </marker>\n    <marker id="marker-arrow" markerWidth="10" markerHeight="10" refX="0" refY="3" orient="auto" markerUnits="strokeWidth">\n      <path d="M0,0 L6,3 L0,6 Z" fill="currentColor"/>\n    </marker>\n  </defs>\n`

export const getMarkerId = (style) => {
  if (style === 'arrow') return 'url(#marker-arrow)'
  if (style === 'dot') return 'url(#marker-dot)'
  return null
}

export const formatSvgNumber = (value) => Number(value).toFixed(2)

export const pointsToPolylineString = (points) =>
  points.map((point) => `${formatSvgNumber(point.x)},${formatSvgNumber(point.y)}`).join(' ')

export const DEFAULT_FILL_COLOR = '#a5b4fc'

export const TOOL_PROPERTY_DEFS = {
  line: [
    { key: 'lineColor', label: 'Line color', type: 'color' },
    { key: 'lineWidth', label: 'Line width', type: 'select', options: LINE_WIDTH_OPTIONS },
    { key: 'startStyle', label: 'Start point style', type: 'select', options: POINT_STYLES },
    { key: 'endStyle', label: 'End point style', type: 'select', options: POINT_STYLES }
  ],
  polyline: [
    { key: 'lineColor', label: 'Line color', type: 'color' },
    { key: 'lineWidth', label: 'Line width', type: 'select', options: LINE_WIDTH_OPTIONS },
    { key: 'startStyle', label: 'Start point style', type: 'select', options: POINT_STYLES },
    { key: 'endStyle', label: 'End point style', type: 'select', options: POINT_STYLES }
  ],
  area: [
    { key: 'hasLine', label: 'Has line', type: 'checkbox' },
    { key: 'lineColor', label: 'Line color', type: 'color' },
    { key: 'lineWidth', label: 'Line width', type: 'select', options: LINE_WIDTH_OPTIONS },
    { key: 'fillColor', label: 'Fill color', type: 'color' }
  ]
}

export const DEFAULT_TOOL_PROPERTY_VALUES = {
  line: {
    lineColor: DEFAULT_LINE_COLOR,
    lineWidth: DEFAULT_LINE_WIDTH,
    startStyle: 'none',
    endStyle: 'none'
  },
  polyline: {
    lineColor: DEFAULT_LINE_COLOR,
    lineWidth: DEFAULT_LINE_WIDTH,
    startStyle: 'none',
    endStyle: 'none'
  },
  area: {
    hasLine: true,
    lineColor: DEFAULT_LINE_COLOR,
    lineWidth: DEFAULT_LINE_WIDTH,
    fillColor: DEFAULT_FILL_COLOR
  }
}
