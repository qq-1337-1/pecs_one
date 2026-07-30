<template>
  <div class="editor-container">
    <div class="editor-header">
      <h2>SVG Editor</h2>
      <div class="editor-controls">
        <button class="btn-tool" :class="{ active: tool === 'line' }" @click="selectTool('line')" title="Draw line">
          ― Line
        </button>
        <button class="btn-tool" :class="{ active: tool === 'polyline' }" @click="selectTool('polyline')" title="Draw polyline">
          ∿ Polyline
        </button>
        <button class="btn-tool" :class="{ active: tool === 'area' }" @click="selectTool('area')" title="Draw area">
          ● Area
        </button>
        <button class="btn-tool" :disabled="!canUndo" @click="undoCommand" title="Undo">
          ↶
        </button>
        <button class="btn-tool" :disabled="!canRedo" @click="redoCommand" title="Redo">
          ↷
        </button>
        <button class="btn-tool" @click="clearCanvas" title="Clear canvas">
          🗑 Clear
        </button>
      </div>
    </div>

    <div class="editor-main">
        <div class="svg-wrapper">
          <svg
            ref="svgCanvas"
            class="svg-canvas"
            viewBox="0 0 100 100"
            preserveAspectRatio="xMidYMid meet"
            @mousedown="handleMouseDown"
            @mousemove="handleMouseMove"
            @mouseup="handleMouseUp"
            @mouseleave="handleMouseUp"
          >
        <!-- Grid background -->
        <defs>
          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e5e7eb" stroke-width="0.5"/>
          </pattern>
          <marker id="marker-dot" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto" markerUnits="strokeWidth">
            <circle cx="3" cy="3" r="2" fill="currentColor"/>
          </marker>
          <marker id="marker-arrow" markerWidth="10" markerHeight="10" refX="0" refY="3" orient="auto" markerUnits="strokeWidth">
            <path d="M0,0 L6,3 L0,6 Z" fill="currentColor"/>
          </marker>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />

        <!-- Drawing elements -->
        <template v-for="(item, idx) in renderItems" :key="`${item.type}-${idx}`">
          <line
            v-if="item.type === 'lines'"
            :x1="item.payload.x1"
            :y1="item.payload.y1"
            :x2="item.payload.x2"
            :y2="item.payload.y2"
            :stroke="item.payload.stroke"
            :stroke-width="item.payload.strokeWidth"
            :marker-start="getMarkerId(item.payload.startStyle)"
            :marker-end="getMarkerId(item.payload.endStyle)"
            :style="{ color: item.payload.stroke }"
            class="drawing-element"
          />
          <polyline
            v-else-if="item.type === 'polylines'"
            :points="item.payload.points"
            :stroke="item.payload.stroke"
            :stroke-width="item.payload.strokeWidth"
            :marker-start="getMarkerId(item.payload.startStyle)"
            :marker-end="getMarkerId(item.payload.endStyle)"
            fill="none"
            stroke-linejoin="round"
            stroke-linecap="round"
            :style="{ color: item.payload.stroke }"
            class="drawing-element"
          />
          <polygon
            v-else-if="item.type === 'areas'"
            :points="item.payload.points"
            :fill="item.payload.fillColor"
            :stroke="item.payload.hasLine ? item.payload.stroke : 'none'"
            :stroke-width="item.payload.hasLine ? item.payload.strokeWidth : 0"
            stroke-linejoin="round"
            stroke-linecap="round"
            class="drawing-element"
          />
        </template>
        <!-- Preview line during draw -->
        <line
          v-if="isDrawing && previewLine"
          :x1="previewLine.x1"
          :y1="previewLine.y1"
          :x2="previewLine.x2"
          :y2="previewLine.y2"
          stroke="#9ca3af"
          stroke-width="1"
          fill="none"
          stroke-dasharray="5,5"
        />
        <!-- Preview polyline during draw -->
        <polyline
          v-if="isDrawing && tool === 'polyline' && previewShape"
          :points="previewShape"
          stroke="#9ca3af"
          stroke-width="1"
          fill="none"
          stroke-linejoin="round"
          stroke-linecap="round"
          stroke-dasharray="5,5"
        />
        <polygon
          v-if="isDrawing && tool === 'area' && previewShape"
          :points="previewShape"
          fill="#d1d5db"
          stroke="#6b7280"
          stroke-width="1"
          stroke-linejoin="round"
          stroke-linecap="round"
          fill-opacity="0.25"
          stroke-dasharray="4,4"
        />
      </svg>
        </div>

      <div class="editor-sidebar">
        <div class="sidebar-section">
          <h3>Tool: {{ TOOL_LABELS[tool] }}</h3>
          <p class="tool-description">
            {{ TOOL_DESCRIPTIONS[tool] }}
          </p>
          <div class="tool-settings">
            <div
              class="setting-row"
              v-for="property in TOOL_PROPERTY_DEFS[tool]"
              :key="property.key"
            >
              <template v-if="property.type === 'checkbox'">
                <label class="checkbox-label">
                  <input
                    type="checkbox"
                    :id="`property-${property.key}`"
                    v-model="activePalette[property.key]"
                  />
                  {{ property.label }}
                </label>
              </template>

                  <template v-else>
                <label class="input-label" :for="`property-${property.key}`">{{ property.label }}</label>
                <template v-if="property.type === 'color'">
                  <input
                    :id="`property-${property.key}`"
                    type="color"
                    v-model="activePalette[property.key]"
                  />
                </template>
                <template v-else-if="property.type === 'select'">
                  <select
                    :id="`property-${property.key}`"
                    v-model="activePalette[property.key]"
                    class="select-input"
                  >
                    <option
                      v-for="option in property.options"
                      :key="typeof option === 'object' ? option.value : option"
                      :value="typeof option === 'object' ? option.value : option"
                    >
                      {{ typeof option === 'object' ? option.label : option }}
                    </option>
                  </select>
                </template>
              </template>
            </div>
          </div>
        </div>

        <div class="sidebar-section">
          <h3>Elements</h3>
          <p class="stat">Lines: {{ lines.length }}</p>
          <p class="stat">Polylines: {{ polylines.length }}</p>
          <p class="stat">Areas: {{ areas.length }}</p>
          <p class="stat">Total: {{ lines.length + polylines.length + areas.length }}</p>
        </div>

        <div class="sidebar-section">
          <h3>Export</h3>
          <label class="input-label" for="pecs-name">Name</label>
          <input
            id="pecs-name"
            v-model="name"
            class="text-input"
            placeholder="Enter PECS name"
          />
          <textarea
            v-model="svgCode"
            class="svg-export"
            readonly
            @click="$event.target.select()"
          ></textarea>
          <button
            class="btn-save"
            :disabled="!name.trim()"
            @click="savePecs"
          >
            💾 Save PECS
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { addPecsCard } from '../utils/storage'
import { generateGUID } from '../utils/guid'
import {
  VIEWBOX,
  DEFAULT_LINE_COLOR,
  DEFAULT_LINE_WIDTH,
  POINT_STYLES,
  LINE_WIDTH_OPTIONS,
  TOOL_LABELS,
  TOOL_DESCRIPTIONS,
  TOOL_PROPERTY_DEFS,
  DEFAULT_TOOL_PROPERTY_VALUES,
  SVG_MARKER_DEFS,
  getMarkerId,
  formatSvgNumber,
  pointsToPolylineString
} from '../utils/editorConfig'
import { getSvgMousePos, isLeftMouseButton, isRapidClick } from '../utils/editorInteraction'
import { createAddGraphicCommand, buildLineElement, buildPolylineElement, buildAreaElement, GraphicCommand } from '../utils/editorCommands'

const tool = ref('line')
const isDrawing = ref(false)
const lines = ref([])
const polylines = ref([])
const areas = ref([])
const currentShapePoints = ref([])
const previewLine = ref(null)
const previewShape = ref(null)
const svgCanvas = ref(null)
const lastClickTime = ref(0)
const name = ref('')
const propertiesPalette = ref(JSON.parse(JSON.stringify(DEFAULT_TOOL_PROPERTY_VALUES)))
const commandHistory = ref([])
const redoStack = ref([])
const SESSION_STORAGE_KEY = 'pecs_editor_state'

const activePalette = computed(() => propertiesPalette.value[tool.value])
const renderItems = computed(() =>
  commandHistory.value.map((command) => ({ type: command.type, payload: command.payload }))
)
const canUndo = computed(() => commandHistory.value.length > 0)
const canRedo = computed(() => redoStack.value.length > 0)

const executeCommand = (command) => {
  command.execute({ lines: lines.value, polylines: polylines.value, areas: areas.value })
  commandHistory.value.push(command)
  redoStack.value = []
}

const undoCommand = () => {
  if (!canUndo.value) return
  const command = commandHistory.value.pop()
  command.undo({ lines: lines.value, polylines: polylines.value, areas: areas.value })
  redoStack.value.push(command)
}

const redoCommand = () => {
  if (!canRedo.value) return
  const command = redoStack.value.pop()
  command.execute({ lines: lines.value, polylines: polylines.value, areas: areas.value })
  commandHistory.value.push(command)
}

const persistSessionState = () => {
  if (typeof sessionStorage === 'undefined') return
  const sessionData = {
    tool: tool.value,
    propertiesPalette: propertiesPalette.value,
    lines: lines.value,
    polylines: polylines.value,
    areas: areas.value,
    commandHistory: commandHistory.value.map((command) => command.toDescriptor()),
    redoStack: redoStack.value.map((command) => command.toDescriptor())
  }

  sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionData))
}

const loadSessionState = () => {
  if (typeof sessionStorage === 'undefined') return
  const stored = sessionStorage.getItem(SESSION_STORAGE_KEY)
  if (!stored) return

  try {
    const sessionData = JSON.parse(stored)

    if (sessionData.tool) tool.value = sessionData.tool
    if (sessionData.propertiesPalette) propertiesPalette.value = sessionData.propertiesPalette
    lines.value = sessionData.lines || []
    polylines.value = sessionData.polylines || []
    areas.value = sessionData.areas || []
    commandHistory.value = (sessionData.commandHistory || []).map((descriptor) => GraphicCommand.fromDescriptor(descriptor))
    redoStack.value = (sessionData.redoStack || []).map((descriptor) => GraphicCommand.fromDescriptor(descriptor))
  } catch (error) {
    console.warn('Failed to restore editor session state:', error)
  }
}

onMounted(() => {
  loadSessionState()
})

watch(
  [
    () => propertiesPalette.value,
    () => lines.value,
    () => polylines.value,
    () => areas.value,
    () => commandHistory.value,
    () => redoStack.value,
    () => tool.value
  ],
  persistSessionState,
  { deep: true }
)

const svgCode = computed(() => {
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">\n${SVG_MARKER_DEFS}`

  renderItems.value.forEach((item) => {
    if (item.type === 'lines') {
      const markerStart = getMarkerId(item.payload.startStyle)
      const markerEnd = getMarkerId(item.payload.endStyle)
      svg += `  <line x1="${formatSvgNumber(item.payload.x1)}" y1="${formatSvgNumber(item.payload.y1)}" x2="${formatSvgNumber(item.payload.x2)}" y2="${formatSvgNumber(item.payload.y2)}" stroke="${item.payload.stroke}" stroke-width="${item.payload.strokeWidth}" style="color: ${item.payload.stroke};"${markerStart ? ` marker-start="${markerStart}"` : ''}${markerEnd ? ` marker-end="${markerEnd}"` : ''}/>
`
    } else if (item.type === 'polylines') {
      const markerStart = getMarkerId(item.payload.startStyle)
      const markerEnd = getMarkerId(item.payload.endStyle)
      svg += `  <polyline points="${item.payload.points}" stroke="${item.payload.stroke}" stroke-width="${item.payload.strokeWidth}" fill="none" stroke-linejoin="round" stroke-linecap="round" style="color: ${item.payload.stroke};"${markerStart ? ` marker-start="${markerStart}"` : ''}${markerEnd ? ` marker-end="${markerEnd}"` : ''}/>
`
    } else if (item.type === 'areas') {
      svg += `  <polygon points="${item.payload.points}" fill="${item.payload.fillColor}" stroke="${item.payload.hasLine ? item.payload.stroke : 'none'}" stroke-width="${item.payload.hasLine ? item.payload.strokeWidth : 0}" stroke-linejoin="round" stroke-linecap="round" />
`
    }
  })

  svg += '</svg>'
  return svg
})

const selectTool = (selectedTool) => {
  if (isDrawing.value) return
  tool.value = selectedTool
  currentShapePoints.value = []
  previewLine.value = null
  previewShape.value = null
}

const createLinePayload = (preview) =>
  buildLineElement({
    x1: Number(preview.x1.toFixed(2)),
    y1: Number(preview.y1.toFixed(2)),
    x2: Number(preview.x2.toFixed(2)),
    y2: Number(preview.y2.toFixed(2)),
    stroke: activePalette.value.lineColor,
    strokeWidth: activePalette.value.lineWidth,
    startStyle: activePalette.value.startStyle,
    endStyle: activePalette.value.endStyle
  })

const createPolylinePayload = (points) =>
  buildPolylineElement({
    points: pointsToPolylineString(points),
    stroke: activePalette.value.lineColor,
    strokeWidth: activePalette.value.lineWidth,
    startStyle: activePalette.value.startStyle,
    endStyle: activePalette.value.endStyle
  })

const createAreaPayload = (points) =>
  buildAreaElement({
    points: pointsToPolylineString(points),
    hasLine: activePalette.value.hasLine,
    stroke: activePalette.value.hasLine ? activePalette.value.lineColor : 'none',
    strokeWidth: activePalette.value.lineWidth,
    fillColor: activePalette.value.fillColor
  })

const handleMouseDown = (event) => {
  if (!isLeftMouseButton(event)) return

  const pos = getSvgMousePos(event, svgCanvas.value, VIEWBOX)

  if (tool.value === 'line') {
    if (!isDrawing.value) {
      isDrawing.value = true
      previewLine.value = { x1: pos.x, y1: pos.y, x2: pos.x, y2: pos.y }
    } else if (previewLine.value) {
      const command = createAddGraphicCommand({
        tool: 'line',
        payload: createLinePayload(previewLine.value)
      })
      executeCommand(command)
      isDrawing.value = false
      previewLine.value = null
    }
    return
  }

  if (tool.value === 'polyline' || tool.value === 'area') {
    const clicksRapid = isRapidClick(lastClickTime.value)
    if (clicksRapid && currentShapePoints.value.length > 1) {
      const payload =
        tool.value === 'area'
          ? createAreaPayload(currentShapePoints.value)
          : createPolylinePayload(currentShapePoints.value)
      const command = createAddGraphicCommand({ tool: tool.value, payload })
      executeCommand(command)
      currentShapePoints.value = []
      isDrawing.value = false
      previewShape.value = null
    } else {
      if (!isDrawing.value) isDrawing.value = true
      currentShapePoints.value.push(pos)
      updateShapePreview()
    }
    lastClickTime.value = Date.now()
  }
}

const handleMouseMove = (event) => {
  const pos = getSvgMousePos(event, svgCanvas.value, VIEWBOX)

  if (tool.value === 'line' && isDrawing.value && previewLine.value) {
    previewLine.value.x2 = pos.x
    previewLine.value.y2 = pos.y
    return
  }

  if ((tool.value === 'polyline' || tool.value === 'area') && currentShapePoints.value.length > 0) {
    const previewPoints = [...currentShapePoints.value, pos]
    previewShape.value = pointsToPolylineString(previewPoints)
  }
}

const handleMouseUp = () => {
  // No mouse-up behavior needed for current editor interactions.
}

const updateShapePreview = () => {
  previewShape.value =
    currentShapePoints.value.length === 0
      ? null
      : pointsToPolylineString(currentShapePoints.value)
}

const clearCanvas = () => {
  if (confirm('Clear all drawings?')) {
    lines.value = []
    polylines.value = []
    areas.value = []
    currentShapePoints.value = []
    isDrawing.value = false
    previewLine.value = null
    previewShape.value = null
    commandHistory.value = []
    redoStack.value = []
  }
}

const saveDrawing = () => {
  const drawing = {
    lines: lines.value,
    polylines: polylines.value,
    areas: areas.value,
    timestamp: new Date().toISOString()
  }
  localStorage.setItem('pecs_drawing', JSON.stringify(drawing))
  alert('Drawing saved to LocalStorage!')
}

const savePecs = async () => {
  const trimmedName = name.value.trim()
  if (!trimmedName) {
    alert('Please enter a name before saving.')
    return
  }

  const card = {
    id: generateGUID(),
    name: trimmedName,
    svg: {
      viewBox: '0 0 100 100',
      content: svgCode.value
    },
    active: true
  }

  try {
    await addPecsCard(card)
    alert(`PECS "${trimmedName}" saved.`)
  } catch (error) {
    console.error('Failed to save PECS card:', error)
    alert('Failed to save PECS card. Please try again.')
  }
}
</script>

<style scoped>
.editor-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: white;
}

.editor-header {
  padding: 1rem;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
}

.editor-header h2 {
  margin: 0;
  font-size: 1.25rem;
  color: #1f2937;
}

.editor-controls {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.btn-tool {
  padding: 0.5rem 1rem;
  background-color: #e5e7eb;
  border: 2px solid transparent;
  border-radius: 0.375rem;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
  font-size: 0.875rem;
}

.btn-tool:hover {
  background-color: #d1d5db;
}

.btn-tool.active {
  background-color: #6366f1;
  color: white;
  border-color: #4f46e5;
}

.editor-main {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 1rem;
  flex: 1;
  padding: 1rem;
  overflow: hidden;
}

.svg-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.svg-canvas {
  max-width: 100%;
  max-height: 100%;
  width: auto;
  height: auto;
  aspect-ratio: 1 / 1;
  background-color: white;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  cursor: crosshair;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.drawing-element {
  pointer-events: none;
}

.editor-sidebar {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  overflow-y: auto;
  padding-right: 0.5rem;
}

.sidebar-section {
  padding: 1rem;
  background-color: #f9fafb;
  border-radius: 0.375rem;
  border: 1px solid #e5e7eb;
}

.sidebar-section h3 {
  margin: 0 0 0.5rem 0;
  font-size: 0.95rem;
  color: #1f2937;
  font-weight: 600;
}

.tool-description {
  margin: 0;
  font-size: 0.8rem;
  color: #6b7280;
  line-height: 1.4;
}

.tool-settings {
  display: grid;
  gap: 0.75rem 1rem;
  margin-top: 1rem;
}

.setting-row {
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: center;
  gap: 0.35rem 0.75rem;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  grid-column: 1 / -1;
}

.select-input {
  width: 100%;
  padding: 0.55rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  background-color: white;
  color: #111827;
}

.stat {
  margin: 0.25rem 0;
  font-size: 0.85rem;
  color: #4b5563;
  font-family: monospace;
}

.svg-export {
  width: 100%;
  height: 120px;
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  font-family: monospace;
  resize: none;
  margin: 0.5rem 0;
  cursor: text;
  overflow-y: auto;
}

.input-label {
  display: block;
  margin-bottom: 0.4rem;
  color: #374151;
  font-size: 0.85rem;
  font-weight: 600;
}

.text-input {
  width: 100%;
  padding: 0.55rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.9rem;
  color: #111827;
}

.btn-save {
  width: 100%;
  padding: 0.5rem;
  background-color: #6366f1;
  color: white;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  transition: background-color 0.2s;
}

.btn-save:hover {
  background-color: #4f46e5;
}

.btn-save:disabled {
  background-color: #c7d2fe;
  cursor: not-allowed;
}

@media (max-width: 1024px) {
  .editor-main {
    grid-template-columns: 1fr;
  }

  .editor-sidebar {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.75rem;
    padding-right: 0;
  }

  .sidebar-section {
    padding: 0.75rem;
  }
}

@media (max-width: 640px) {
  .editor-header {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }

  .editor-controls {
    width: 100%;
    justify-content: flex-start;
  }

  .btn-tool {
    font-size: 0.75rem;
    padding: 0.4rem 0.8rem;
  }

  .editor-sidebar {
    grid-template-columns: 1fr;
  }
}
</style>
