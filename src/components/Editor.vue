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
      <svg
        ref="svgCanvas"
        class="svg-canvas"
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
          stroke="#6366f1"
          stroke-width="2"
          class="drawing-element"
        />
        <polyline
          v-for="(polyline, idx) in polylines"
          :key="`polyline-${idx}`"
          :points="polyline.points"
          stroke="#6366f1"
          stroke-width="2"
          fill="none"
          stroke-linejoin="round"
          stroke-linecap="round"
          class="drawing-element"
        />
        <!-- Preview line during draw -->
        <line
          v-if="isDrawing && previewLine"
          :x1="previewLine.x1"
          :y1="previewLine.y1"
          :x2="previewLine.x2"
          :y2="previewLine.y2"
          stroke="#a5b4fc"
          stroke-width="2"
          stroke-dasharray="5,5"
        />
        <!-- Preview polyline during draw -->
        <polyline
          v-if="isDrawing && previewPolyline"
          :points="previewPolyline"
          stroke="#a5b4fc"
          stroke-width="2"
          fill="none"
          stroke-linejoin="round"
          stroke-linecap="round"
          stroke-dasharray="5,5"
        />
      </svg>

      <div class="editor-sidebar">
        <div class="sidebar-section">
          <h3>Tool: {{ tool === 'line' ? 'Line' : 'Polyline' }}</h3>
          <p class="tool-description">
            {{ tool === 'line' ? 'Click twice to draw a line' : 'Click multiple times to draw, double-click to finish' }}
          </p>
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

const svgCode = computed(() => {
  let svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600">\n'

  lines.value.forEach((line) => {
    svg += `  <line x1="${line.x1}" y1="${line.y1}" x2="${line.x2}" y2="${line.y2}" stroke="#6366f1" stroke-width="2"/>\n`
  })

  polylines.value.forEach((polyline) => {
    svg += `  <polyline points="${polyline.points}" stroke="#6366f1" stroke-width="2" fill="none" stroke-linejoin="round" stroke-linecap="round"/>\n`
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
  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top
  }
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
      lines.value.push(previewLine.value)
      isDrawing.value = false
      previewLine.value = null
    }
  } else if (tool.value === 'polyline') {
    const now = Date.now()
    const isDoubleClick = now - lastClickTime.value < 300

    if (isDoubleClick && currentPointsForPolyline.value.length > 1) {
      // Complete polyline
      const points = currentPointsForPolyline.value.map((p) => `${p.x},${p.y}`).join(' ')
      polylines.value.push({ points })
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
    previewPolyline.value = [
      ...currentPointsForPolyline.value.map((p) => `${p.x},${p.y}`),
      `${pos.x},${pos.y}`
    ].join(' ')
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
    previewPolyline.value = currentPointsForPolyline.value.map((p) => `${p.x},${p.y}`).join(' ')
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
      viewBox: '0 0 800 600',
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

.svg-canvas {
  width: 100%;
  height: 100%;
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
