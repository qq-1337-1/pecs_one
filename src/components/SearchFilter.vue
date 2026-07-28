<template>
  <div class="search-filter">
    <input
      type="text"
      :value="modelValue"
      @input="$emit('update:modelValue', $event.target.value)"
      placeholder="🔍 Search cards by name..."
      class="search-input"
    />
    <button
      v-if="modelValue"
      @click="$emit('update:modelValue', '')"
      class="btn-clear-search"
      title="Clear search"
    >
      ✕
    </button>
  </div>
</template>

<script setup>
defineProps({
  modelValue: {
    type: String,
    default: ''
  }
})

defineEmits(['update:modelValue'])
</script>

<style scoped>
.search-filter {
  position: relative;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.search-input {
  width: 100%;
  padding: 0.75rem 2.5rem 0.75rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.95rem;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.search-input:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.search-input::placeholder {
  color: #9ca3af;
}

.btn-clear-search {
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #9ca3af;
  cursor: pointer;
  font-size: 1.125rem;
  padding: 0.25rem;
  transition: color 0.2s;
}

.btn-clear-search:hover {
  color: #6366f1;
}
</style>
