export class GraphicCommand {
  constructor({ type, payload }) {
    this.type = type
    this.payload = payload
  }

  execute(targets) {
    const list = targets[this.type]
    if (!Array.isArray(list)) {
      throw new Error(`Invalid graphic target: ${this.type}`)
    }

    list.push(this.payload)
  }
}

export const createAddGraphicCommand = ({ tool, payload }) => {
  if (tool === 'line') {
    return new GraphicCommand({ type: 'lines', payload })
  }

  if (tool === 'polyline') {
    return new GraphicCommand({ type: 'polylines', payload })
  }

  if (tool === 'area') {
    return new GraphicCommand({ type: 'areas', payload })
  }

  throw new Error(`Unsupported tool: ${tool}`)
}

export const buildLineElement = ({ x1, y1, x2, y2, stroke, strokeWidth, startStyle, endStyle }) => ({
  x1,
  y1,
  x2,
  y2,
  stroke,
  strokeWidth,
  startStyle,
  endStyle
})

export const buildPolylineElement = ({ points, stroke, strokeWidth, startStyle, endStyle }) => ({
  points,
  stroke,
  strokeWidth,
  startStyle,
  endStyle
})

export const buildAreaElement = ({ points, hasLine, stroke, strokeWidth, fillColor }) => ({
  points,
  hasLine,
  stroke,
  strokeWidth,
  fillColor
})
