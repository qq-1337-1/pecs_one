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

  undo(targets) {
    const list = targets[this.type]
    if (!Array.isArray(list)) {
      throw new Error(`Invalid graphic target: ${this.type}`)
    }

    const index = list.map((item) => JSON.stringify(item)).lastIndexOf(JSON.stringify(this.payload))
    if (index !== -1) {
      list.splice(index, 1)
    }
  }

  toDescriptor() {
    return { type: this.type, payload: this.payload }
  }

  static fromDescriptor(descriptor) {
    return new GraphicCommand({ type: descriptor.type, payload: descriptor.payload })
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
