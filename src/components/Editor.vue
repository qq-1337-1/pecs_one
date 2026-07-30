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
        <button class="btn-tool" @click="clearCanvas" title="Clear canvas">
          🗑 Clear
        </button>
        <button class="btn-tool" @click="saveDrawing" title="Save drawing">
          💾 Save
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
        <line
          v-for="(line, idx) in lines"
          :key="`line-${idx}`"
          :x1="line.x1"
          :y1="line.y1"
          :x2="line.x2"
          :y2="line.y2"
          :stroke="line.stroke"
          :stroke-width="line.strokeWidth"
          :marker-start="getMarkerId(line.startStyle)"
          :marker-end="getMarkerId(line.endStyle)"
          :style="{ color: line.stroke }"
          class="drawing-element"
        />
        <polyline
          v-for="(polyline, idx) in polylines"
          :key="`polyline-${idx}`"
          :points="polyline.points"
          :stroke="polyline.stroke"
          :stroke-width="polyline.strokeWidth"
          :marker-start="getMarkerId(polyline.startStyle)"
          :marker-end="getMarkerId(polyline.endStyle)"
          fill="none"
          stroke-linejoin="round"
          stroke-linecap="round"
          :style="{ color: polyline.stroke }"
          class="drawing-element"
        />
        <!-- Preview line during draw -->
        <line
          v-if="isDrawing && previewLine"
          :x1="previewLine.x1"
          :y1="previewLine.y1"
          :x2="previewLine.x2"
          :y2="previewLine.y2"
          :stroke="lineColor"
          :stroke-width="lineWidth"
          :marker-start="getMarkerId(startPointStyle)"
          :marker-end="getMarkerId(endPointStyle)"
          :style="{ color: lineColor }"
          stroke-dasharray="5,5"
        />
        <!-- Preview polyline during draw -->
        <polyline
          v-if="isDrawing && previewPolyline"
          :points="previewPolyline"
          :stroke="lineColor"
          :stroke-width="lineWidth"
          :marker-start="getMarkerId(startPointStyle)"
          :marker-end="getMarkerId(endPointStyle)"
          fill="none"
          stroke-linejoin="round"
          stroke-linecap="round"
          :style="{ color: lineColor }"
          stroke-dasharray="5,5"
        />
      </svg>
        </div>

      <div class="editor-sidebar">
        <div class="sidebar-section">
          <h3>Tool: {{ tool === 'line' ? 'Line' : 'Polyline' }}</h3>
          <p class="tool-description">
            {{ tool === 'line' ? 'Click twice to draw a line' : 'Click multiple times to draw, double-click to finish' }}
          </p>
          <div class="tool-settings">
            <div class="setting-row">
              <label class="input-label" for="line-color">Line color</label>
              <input id="line-color" type="color" v-model="lineColor" />
            </div>
            <div class="setting-row">
              <label class="input-label" for="line-width">Line width</label>
              <select id="line-width" v-model.number="lineWidth" class="select-input">
                <option v-for="size in lineWidthOptions" :key="size" :value="size">{{ size }}</option>
              </select>
            </div>
            <div class="setting-row">
              <label class="input-label" for="start-style">Start point style</label>
              <select id="start-style" v-model="startPointStyle" class="select-input">
                <option v-for="style in pointStyles" :key="style.value" :value="style.value">{{ style.label }}</option>
              </select>
            </div>
            <div class="setting-row">
              <label class="input-label" for="end-style">End point style</label>
              <select id="end-style" v-model="endPointStyle" class="select-input">
                <option v-for="style in pointStyles" :key="style.value" :value="style.value">{{ style.label }}</option>
              </select>
            </div>
          </div>
        </div>

        <div class="sidebar-section">
          <h3>Elements</h3>
          <p class="stat">Lines: {{ lines.length }}</p>
          <p class="stat">Polylines: {{ polylines.length }}</p>
          <p class="stat">Total: {{ lines.length + polylines.length }}</p>
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
import { ref, computed } from 'vue'
import { addPecsCard } from '../utils/storage'
import { generateGUID } from '../utils/guid'

const tool = ref('line')
const isDrawing = ref(false)
const lines = ref([])
const polylines = ref([])
const currentPointsForPolyline = ref([])
const previewLine = ref(null)
const previewPolyline = ref(null)
const svgCanvas = ref(null)
const lastClickTime = ref(0)
const name = ref('')
const lineColor = ref('#6366f1')
const lineWidth = ref(2)
const startPointStyle = ref('none')
const endPointStyle = ref('none')

const pointStyles = [
  { value: 'none', label: 'None' },
  { value: 'dot', label: 'Dot' },
  { value: 'arrow', label: 'Arrow' }
]

const lineWidthOptions = [1, 2, 3, 4, 5, 6, 8, 10]

const getMarkerId = (style) => {
  if (style === 'arrow') return 'url(#marker-arrow)'
  if (style === 'dot') return 'url(#marker-dot)'
  return null
}

// Use the same internal coordinate system as PECS cards
const VIEWBOX = { x: 0, y: 0, width: 100, height: 100 }

const svgCode = computed(() => {
  const fmt = (n) => Number(n).toFixed(2)
  const markerDefs = `  <defs>\n    <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">\n      <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e5e7eb" stroke-width="0.5"/>\n    </pattern>\n    <marker id="marker-dot" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto" markerUnits="strokeWidth">\n      <circle cx="3" cy="3" r="2" fill="currentColor"/>\n    </marker>\n    <marker id="marker-arrow" markerWidth="10" markerHeight="10" refX="0" refY="3" orient="auto" markerUnits="strokeWidth">\n      <path d="M0,0 L6,3 L0,6 Z" fill="currentColor"/>\n    </marker>\n  </defs>\n`

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">\n${markerDefs}`

  lines.value.forEach((line) => {
    const markerStart = getMarkerId(line.startStyle)
    const markerEnd = getMarkerId(line.endStyle)
    svg += `  <line x1="${fmt(line.x1)}" y1="${fmt(line.y1)}" x2="${fmt(line.x2)}" y2="${fmt(line.y2)}" stroke="${line.stroke}" stroke-width="${line.strokeWidth}" style="color: ${line.stroke};"${markerStart ? ` marker-start=\"${markerStart}\"` : ''}${markerEnd ? ` marker-end=\"${markerEnd}\"` : ''}/>\n`
  })

  polylines.value.forEach((polyline) => {
    const markerStart = getMarkerId(polyline.startStyle)
    const markerEnd = getMarkerId(polyline.endStyle)
    svg += `  <polyline points="${polyline.points}" stroke="${polyline.stroke}" stroke-width="${polyline.strokeWidth}" fill="none" stroke-linejoin="round" stroke-linecap="round" style="color: ${polyline.stroke};"${markerStart ? ` marker-start=\"${markerStart}\"` : ''}${markerEnd ? ` marker-end=\"${markerEnd}\"` : ''}/>\n`
  })

  svg += '</svg>'
  return svg
})

const selectTool = (selectedTool) => {
  if (isDrawing.value) return
  tool.value = selectedTool
  currentPointsForPolyline.value = []
  previewLine.value = null
  previewPolyline.value = null
}

const getMousePos = (event) => {
  const rect = svgCanvas.value.getBoundingClientRect()
  const px = event.clientX - rect.left
  const py = event.clientY - rect.top
  // map pixel coordinates to viewBox coordinates (0..100)
  const x = (px / rect.width) * VIEWBOX.width + VIEWBOX.x
  const y = (py / rect.height) * VIEWBOX.height + VIEWBOX.y
  return { x, y }
}

const handleMouseDown = (event) => {
  if (event.button !== 0) return // Only left click

  const pos = getMousePos(event)

  if (tool.value === 'line') {
    if (!isDrawing.value) {
      isDrawing.value = true
      previewLine.value = { x1: pos.x, y1: pos.y, x2: pos.x, y2: pos.y }
    } else {
      // Second click - complete the line
      // store numbers rounded to two decimals
      lines.value.push({
        x1: Number(previewLine.value.x1.toFixed(2)),
        y1: Number(previewLine.value.y1.toFixed(2)),
        x2: Number(previewLine.value.x2.toFixed(2)),
        y2: Number(previewLine.value.y2.toFixed(2)),
        stroke: lineColor.value,
        strokeWidth: lineWidth.value,
        startStyle: startPointStyle.value,
        endStyle: endPointStyle.value
      })
      isDrawing.value = false
      previewLine.value = null
    }
  } else if (tool.value === 'polyline') {
    const now = Date.now()
    const isDoubleClick = now - lastClickTime.value < 300

    if (isDoubleClick && currentPointsForPolyline.value.length > 1) {
      // Complete polyline
      const points = currentPointsForPolyline.value.map((p) => `${Number(p.x.toFixed(2))},${Number(p.y.toFixed(2))}`).join(' ')
      polylines.value.push({
        points,
        stroke: lineColor.value,
        strokeWidth: lineWidth.value,
        startStyle: startPointStyle.value,
        endStyle: endPointStyle.value
      })
      currentPointsForPolyline.value = []
      isDrawing.value = false
      previewPolyline.value = null
    } else {
      // Add point
      if (!isDrawing.value) isDrawing.value = true
      currentPointsForPolyline.value.push(pos)
      updatePolylinePreview()
    }

    lastClickTime.value = now
  }
}

const handleMouseMove = (event) => {
  const pos = getMousePos(event)

  if (tool.value === 'line' && isDrawing.value && previewLine.value) {
    previewLine.value.x2 = pos.x
    previewLine.value.y2 = pos.y
  } else if (tool.value === 'polyline' && currentPointsForPolyline.value.length > 0) {
    const points = [
      ...currentPointsForPolyline.value.map((p) => `${Number(p.x.toFixed(2))},${Number(p.y.toFixed(2))}`),
      `${Number(pos.x.toFixed(2))},${Number(pos.y.toFixed(2))}`
    ].join(' ')
    previewPolyline.value = points
  }
}

const handleMouseUp = () => {
  // Nothing needed for line as click handles it
  // Polyline uses double-click, handled in handleMouseDown
}

const updatePolylinePreview = () => {
  if (currentPointsForPolyline.value.length === 0) {
    previewPolyline.value = null
  } else {
    previewPolyline.value = currentPointsForPolyline.value.map((p) => `${Number(p.x.toFixed(2))},${Number(p.y.toFixed(2))}`).join(' ')
  }
}

const clearCanvas = () => {
  if (confirm('Clear all drawings?')) {
    lines.value = []
    polylines.value = []
    currentPointsForPolyline.value = []
    isDrawing.value = false
    previewLine.value = null
    previewPolyline.value = null
  }
}

const saveDrawing = () => {
  const drawing = {
    lines: lines.value,
    polylines: polylines.value,
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
  gap: 0.75rem;
  margin-top: 1rem;
}

.setting-row {
  display: grid;
  gap: 0.35rem;
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
