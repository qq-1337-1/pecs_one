<template>
  <div class="cards-container">
    <div class="cards-header">
      <h2>Manage Cards</h2>
    </div>

    <SearchFilter v-model="searchQuery" />

    <div class="cards-grid">
      <div
        v-for="card in filteredCards"
        :key="card.id"
        class="card-row"
        :class="{ inactive: !card.active }"
      >
        <PecCard :card="card" />
        <div class="card-meta">
          <label class="status-toggle">
            <input
              type="checkbox"
              :checked="card.active"
              @change="toggleActive(card.id, $event.target.checked)"
            />
            Active
          </label>
          <span class="card-state">{{ card.active ? 'Active' : 'Inactive' }}</span>
        </div>
      </div>

      <div v-if="filteredCards.length === 0" class="empty-state">
        {{ searchQuery ? 'No cards match your search' : 'No cards available' }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import PecCard from './PecCard.vue'
import SearchFilter from './SearchFilter.vue'
import { loadPecsCards, updatePecsCard } from '../utils/storage'

const cards = ref([])
const searchQuery = ref('')

const filteredCards = computed(() => {
  const query = searchQuery.value.toLowerCase().trim()
  return query
    ? cards.value.filter((card) => card.name.toLowerCase().includes(query))
    : cards.value
})

const loadCards = async () => {
  cards.value = await loadPecsCards()
}

onMounted(loadCards)

const toggleActive = async (cardId, isActive) => {
  cards.value = await updatePecsCard(cardId, { active: isActive })
}
</script>

<style scoped>
.cards-container {
  display: flex;
  flex-direction: column;
  padding: 1.5rem;
  height: 100%;
  background-color: #f8fafc;
}

.cards-header {
  padding-bottom: 1rem;
  border-bottom: 1px solid #e5e7eb;
  margin-bottom: 1rem;
}

.cards-header h2 {
  margin: 0;
  color: #111827;
  font-size: 1.5rem;
}

.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 1rem;
  flex: 1;
  overflow-y: auto;
}

.card-row {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  background-color: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  padding: 1rem;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.05);
  transition: background-color 0.2s, opacity 0.2s;
}

.card-row.inactive {
  opacity: 0.6;
  background-color: #f8fafc;
}

.card-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
}

.status-toggle {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  color: #374151;
}

.status-toggle input {
  width: 1rem;
  height: 1rem;
  accent-color: #6366f1;
}

.card-state {
  font-size: 0.85rem;
  font-weight: 600;
  color: #4b5563;
}

.empty-state {
  grid-column: 1 / -1;
  padding: 2rem 1rem;
  text-align: center;
  color: #9ca3af;
  font-style: italic;
}

@media (max-width: 768px) {
  .cards-grid {
    grid-template-columns: 1fr;
  }
}
</style>
