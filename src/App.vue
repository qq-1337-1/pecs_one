<template>
  <div class="app">
    <header class="app-header">
      <h1>PECS Board</h1>
    </header>

    <nav class="app-tabs">
      <button
        class="tab-button"
        :class="{ active: activeTab === 'board' }"
        @click="activeTab = 'board'"
      >
        📋 Board
      </button>
      <button
        class="tab-button"
        :class="{ active: activeTab === 'editor' }"
        @click="activeTab = 'editor'"
      >
        ✏️ Editor
      </button>
    </nav>

    <main class="app-content">
      <Board v-if="activeTab === 'board'" />
      <Editor v-if="activeTab === 'editor'" />
    </main>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import Board from './components/Board.vue'
import Editor from './components/Editor.vue'

const activeTab = ref('board')
</script>

<style scoped>
.app {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #f8f9fa;
}

.app-header {
  padding: 1rem;
  background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  flex-shrink: 0;
}

.app-header h1 {
  margin: 0;
  font-size: 1.75rem;
  font-weight: 600;
}

.app-tabs {
  display: flex;
  gap: 0;
  background-color: #ffffff;
  border-bottom: 1px solid #e5e7eb;
  flex-shrink: 0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.tab-button {
  flex: 1;
  padding: 1rem;
  border: none;
  background-color: transparent;
  color: #6b7280;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  border-bottom: 3px solid transparent;
}

.tab-button:hover {
  background-color: #f3f4f6;
  color: #4b5563;
}

.tab-button.active {
  color: #6366f1;
  border-bottom-color: #6366f1;
  background-color: #f0f4ff;
}

.app-content {
  flex: 1;
  overflow: auto;
  display: flex;
  flex-direction: column;
}
</style>
