<template>
  <div class="board-container">
    <div class="board-section">
      <div class="board-header">
        <h2>Board</h2>
        <button class="btn-clear" @click="clearBoard" title="Clear all cards from board">
          Clear Board
        </button>
      </div>
      <div class="board" @drop="handleDrop" @dragover="handleDragOver">
        <div
          v-for="card in boardCards"
          :key="card.id"
          class="board-card"
          :draggable="true"
          @dragstart="handleDragStart($event, card, 'board')"
        >
          <PecCard :card="card" draggable @remove="removeFromBoard(card.id)" />
        </div>
        <div v-if="boardCards.length === 0" class="empty-state">
          Drag cards here to arrange them
        </div>
      </div>
    </div>

    <div class="pocket-section">
      <div class="pocket-header">
        <h2>Pocket (Available Cards)</h2>
      </div>
      <SearchFilter v-model="searchQuery" />
      <div class="pocket">
        <div
          v-for="card in filteredPocketCards"
          :key="card.id"
          :draggable="true"
          @dragstart="handleDragStart($event, card, 'pocket')"
        >
          <PecCard :card="card" draggable />
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

const allCards = ref([])
const boardCards = ref([])
const searchQuery = ref('')

const pocketCards = computed(() => {
  const boardIds = new Set(boardCards.value.map((c) => c.id))
  return allCards.value.filter((card) => !boardIds.has(card.id))
})

const filteredPocketCards = computed(() => {
  if (!searchQuery.value) return pocketCards.value
  const query = searchQuery.value.toLowerCase()
  return pocketCards.value.filter((card) =>
    card.name.toLowerCase().includes(query)
  )
})

onMounted(async () => {
  allCards.value = await loadPecsCards()
  boardCards.value = await loadBoardState()
})

const handleDragStart = (event, card, source) => {
  event.dataTransfer.effectAllowed = 'copy'
  event.dataTransfer.setData('card', JSON.stringify(card))
  event.dataTransfer.setData('source', source)
}

const handleDragOver = (event) => {
  event.preventDefault()
  event.dataTransfer.dropEffect = 'copy'
  event.currentTarget.classList.add('drag-over')
}

const handleDrop = (event) => {
  event.preventDefault()
  event.currentTarget.classList.remove('drag-over')

  try {
    const cardData = event.dataTransfer.getData('card')
    const card = JSON.parse(cardData)

    // Check if card is already on board
    if (!boardCards.value.find((c) => c.id === card.id)) {
      boardCards.value.push(card)
      saveBoardState(boardCards.value)
    }
  } catch (error) {
    console.error('Drop failed:', error)
  }
}

const removeFromBoard = (cardId) => {
  boardCards.value = boardCards.value.filter((c) => c.id !== cardId)
  saveBoardState(boardCards.value)
}

const clearBoard = () => {
  if (confirm('Clear all cards from the board?')) {
    boardCards.value = []
    saveBoardState(boardCards.value)
  }
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
  padding: 0.5rem 1rem;
  background-color: #ef4444;
  color: white;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  transition: background-color 0.2s;
}

.btn-clear:hover {
  background-color: #dc2626;
}

.board {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 1rem;
  padding: 1rem;
  overflow-y: auto;
  background-color: #fafbfc;
  border: 2px dashed #cbd5e1;
  border-radius: 0.375rem;
  min-height: 200px;
}

.board.drag-over {
  background-color: #e0e7ff;
  border-color: #6366f1;
}

.board-card {
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
    gap: 0.5rem;
    padding: 0.75rem;
  }

  .pocket {
    gap: 0.5rem;
    padding: 0.75rem;
  }
}
</style>
