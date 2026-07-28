<template>
  <div class="pec-card">
    <div class="card-image-container">
      <svg
        v-if="isSvgContent"
        :viewBox="card.svg.viewBox || '0 0 100 100'"
        class="card-svg"
        v-html="card.svg.content"
      ></svg>
      <img v-else :src="card.svg" :alt="card.name" class="card-image" />
    </div>
    <div class="card-name">{{ card.name }}</div>
    <button
      v-if="draggable"
      class="btn-remove"
      @click.stop="handleRemove"
      title="Remove from board"
    >
      ✕
    </button>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  card: {
    type: Object,
    required: true
  },
  draggable: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['remove'])

const isSvgContent = computed(() => {
  return typeof props.card.svg === 'object' && props.card.svg.content
})

const handleRemove = () => {
  emit('remove', props.card.id)
}
</script>

<style scoped>
.pec-card {
  display: flex;
  flex-direction: column;
  background-color: white;
  border: 2px solid #d1d5db;
  border-radius: 0.5rem;
  padding: 0.75rem;
  cursor: grab;
  transition: all 0.2s;
  position: relative;
  user-select: none;
  height: 100%;
}

.pec-card:active {
  cursor: grabbing;
}

.pec-card:hover {
  border-color: #6366f1;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.15);
  transform: translateY(-2px);
}

.card-image-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f9fafb;
  border-radius: 0.375rem;
  padding: 0.5rem;
  margin-bottom: 0.5rem;
  min-height: 80px;
  overflow: hidden;
}

.card-svg,
.card-image {
  max-width: 100%;
  max-height: 100%;
  width: auto;
  height: auto;
}

.card-name {
  font-size: 0.875rem;
  font-weight: 500;
  text-align: center;
  color: #1f2937;
  word-break: break-word;
  flex-shrink: 0;
}

.btn-remove {
  position: absolute;
  top: 0.25rem;
  right: 0.25rem;
  width: 1.5rem;
  height: 1.5rem;
  padding: 0;
  background-color: #ef4444;
  color: white;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;
  opacity: 0;
}

.pec-card:hover .btn-remove {
  opacity: 1;
}

.btn-remove:hover {
  background-color: #dc2626;
}
</style>
