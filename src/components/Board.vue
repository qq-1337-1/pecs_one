<template>
  <div class="board-container">
    <div class="board-section">
      <div class="board-header">
        <h2>Board</h2>
        <button class="btn-clear" @click="clearBoard" title="Clear all cards from board">
          🗑️
        </button>
      </div>
      <div class="board">
        <div
          v-for="(slotId, index) in boardSlots"
          :key="index"
          class="board-slot"
          :class="{ 'slot-occupied': slotId }"
          @drop="handleSlotDrop($event, index)"
          @dragover="handleSlotDragOver($event, index)"
          @dragleave="handleSlotDragLeave($event, index)"
        >
          <div
            v-if="slotId"
            class="board-card"
            :draggable="true"
            @dragstart="handleCardDragStart($event, getCardById(slotId), index)"
            @dragend="handleCardDragEnd"
          >
            <PecCard
              :card="getCardById(slotId)"
              :draggable="true"
              :showRemove="true"
              @remove="removeFromSlot(index)"
            />
          </div>
          <div v-else class="slot-placeholder">
            {{ index + 1 }}
          </div>
        </div>
      </div>
    </div>

    <div class="pocket-section">
      <div class="pocket-header">
        <h2>Pocket (Available Cards)</h2>
      </div>
      <SearchFilter v-model="searchQuery" />
      <div class="pocket" @drop="handlePocketDrop" @dragover="handleSlotDragOver">
        <div
          v-for="card in filteredPocketCards"
          :key="card.id"
          :draggable="true"
          @dragstart="handleCardDragStart($event, card, -1)"
          @dragend="handleCardDragEnd"
        >
          <PecCard :card="card" :draggable="true" :showRemove="false" :showAppend="true" @append="appendToBoard(card.id)" />
        </div>
        <div v-if="filteredPocketCards.length === 0" class="empty-state">
          {{ searchQuery ? 'No cards match your search' : 'No cards available' }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import PecCard from './PecCard.vue'
import SearchFilter from './SearchFilter.vue'
import { loadPecsCards, loadBoardState, saveBoardState } from '../utils/storage'

const MAX_SLOTS = 12
const allCards = ref([])
const boardSlots = ref(Array(MAX_SLOTS).fill(null)) // Array of card IDs or null
const searchQuery = ref('')
const dragSourceSlot = ref(null)

const activeCards = computed(() =>
  allCards.value.filter((card) => card.active !== false)
)

const boardCardIds = computed(() =>
  boardSlots.value.filter(Boolean)
)

const pocketCards = computed(() =>
  activeCards.value.filter((card) => !boardCardIds.value.includes(card.id))
)

const filteredPocketCards = computed(() => {
  if (!searchQuery.value) return pocketCards.value
  const query = searchQuery.value.toLowerCase()
  return pocketCards.value.filter((card) =>
    card.name.toLowerCase().includes(query)
  )
})

onMounted(async () => {
  allCards.value = await loadPecsCards()
  const savedBoardIds = await loadBoardState()
  // Convert old format (array of IDs) to slot format
  boardSlots.value = Array(MAX_SLOTS).fill(null)
  savedBoardIds.forEach((id, idx) => {
    if (idx < MAX_SLOTS) {
      boardSlots.value[idx] = id
    }
  })
})

const getCardById = (cardId) => {
  return allCards.value.find((card) => card.id === cardId)
}

const handleCardDragStart = (event, card, slotIndex) => {
  dragSourceSlot.value = slotIndex
  event.dataTransfer.effectAllowed = 'move'
  event.dataTransfer.setData('card', JSON.stringify(card))
  event.dataTransfer.setData('source', slotIndex === -1 ? 'pocket' : 'board')
}

const handleCardDragEnd = () => {
  dragSourceSlot.value = null
}

const handleSlotDragOver = (event, slotIndex) => {
  event.preventDefault()
  event.dataTransfer.dropEffect = 'move'
  event.currentTarget.classList.add('drag-over')
}

const handleSlotDragLeave = (event, slotIndex) => {
  event.currentTarget.classList.remove('drag-over')
}

const handleSlotDrop = (event, slotIndex) => {
  event.preventDefault()
  event.currentTarget.classList.remove('drag-over')

  try {
    const cardData = event.dataTransfer.getData('card')
    const source = event.dataTransfer.getData('source')
    const card = JSON.parse(cardData)

    if (source === 'board') {
      // Moving card from one slot to another
      if (dragSourceSlot.value !== null && dragSourceSlot.value !== slotIndex) {
        // Only swap/move if target slot is empty
        if (!boardSlots.value[slotIndex]) {
          boardSlots.value[slotIndex] = card.id
          boardSlots.value[dragSourceSlot.value] = null
          saveBoardState(boardCardIds.value)
        }
      }
    } else {
      // Dropping card from pocket
      if (!boardSlots.value[slotIndex]) {
        boardSlots.value[slotIndex] = card.id
        saveBoardState(boardCardIds.value)
      }
    }
  } catch (error) {
    console.error('Drop failed:', error)
  }
}

const appendToBoard = (cardId) => {
  // Find first empty slot and append card there
  const emptySlot = boardSlots.value.findIndex((slot) => slot === null)
  if (emptySlot !== -1) {
    boardSlots.value[emptySlot] = cardId
    saveBoardState(boardCardIds.value)
  }
}

const handlePocketDrop = (event) => {
  event.preventDefault()
  event.currentTarget.classList.remove('drag-over')

  try {
    const cardData = event.dataTransfer.getData('card')
    const source = event.dataTransfer.getData('source')
    const card = JSON.parse(cardData)

    // Only remove from board if card was dragged from board
    if (source === 'board' && boardCardIds.value.includes(card.id)) {
      const slotIndex = boardSlots.value.indexOf(card.id)
      if (slotIndex !== -1) {
        boardSlots.value[slotIndex] = null
        saveBoardState(boardCardIds.value)
      }
    }
  } catch (error) {
    console.error('Drop failed:', error)
  }
}

const removeFromSlot = (slotIndex) => {
  boardSlots.value[slotIndex] = null
  saveBoardState(boardCardIds.value)
}

const clearBoard = () => {
  boardSlots.value = Array(MAX_SLOTS).fill(null)
  saveBoardState([])
}
</script>

<style scoped>
.board-container {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 1rem;
  padding: 1.5rem;
  height: 100%;
  overflow: hidden;
}

.board-section,
.pocket-section {
  display: flex;
  flex-direction: column;
  background-color: white;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.board-header,
.pocket-header {
  padding: 1rem;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.board-header h2,
.pocket-header h2 {
  margin: 0;
  font-size: 1.25rem;
  color: #1f2937;
}

.btn-clear {
  padding: 0.25rem 0.5rem;
  background-color: transparent;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  font-size: 1.25rem;
  transition: background-color 0.2s;
}

.btn-clear:hover {
  background-color: #f3f4f6;
}

.board {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  padding: 1rem;
  overflow-y: auto;
  background-color: #fafbfc;
}

.board-slot {
  min-height: 140px;
  border: 2px dashed #cbd5e1;
  border-radius: 0.375rem;
  background-color: #f9fafb;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  cursor: drop;
  transition: all 0.2s;
}

.board-slot:hover {
  border-color: #a1aac4;
  background-color: #f3f4f6;
}

.board-slot.drag-over {
  border-color: #6366f1;
  background-color: #e0e7ff;
  box-shadow: inset 0 0 0 2px rgba(99, 102, 241, 0.1);
}

.board-slot.slot-occupied {
  border: none;
  background-color: transparent;
  overflow: hidden;
}

.slot-placeholder {
  font-size: 0.85rem;
  color: #d1d5db;
  font-weight: 500;
  user-select: none;
}

.board-card {
  width: 100%;
  height: 100%;
  cursor: move;
}

.pocket {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 0.75rem;
  padding: 1rem;
  overflow-y: auto;
}

.pocket .drag-over {
  background-color: #e0e7ff;
}

.empty-state {
  grid-column: 1 / -1;
  padding: 2rem 1rem;
  text-align: center;
  color: #9ca3af;
  font-style: italic;
}

@media (max-width: 1024px) {
  .board-container {
    grid-template-columns: 1fr;
  }

  .board {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 640px) {
  .board-container {
    padding: 0.75rem;
    gap: 0.75rem;
  }

  .board-header,
  .pocket-header {
    padding: 0.75rem;
  }

  .board {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.5rem;
    padding: 0.75rem;
  }

  .pocket {
    gap: 0.5rem;
    padding: 0.75rem;
  }
}
</style>
