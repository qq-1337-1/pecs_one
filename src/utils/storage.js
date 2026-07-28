/**
 * LocalStorage utilities for PECS cards management
 */

const STORAGE_KEY = 'pecs_cards'
const BOARD_STATE_KEY = 'pecs_board_state'

/**
 * Load PECS cards from LocalStorage or fetch from static file
 */
export async function loadPecsCards() {
  // Try to get from LocalStorage first
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored) {
    try {
      return JSON.parse(stored)
    } catch (error) {
      console.error('Failed to parse stored cards:', error)
    }
  }

  // Fetch from static file
  try {
    const response = await fetch('/data/PECS.cards')
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
    const cards = await response.json()
    savePecsCards(cards)
    return cards
  } catch (error) {
    console.error('Failed to load PECS cards:', error)
    return []
  }
}

/**
 * Save PECS cards to LocalStorage
 */
export function savePecsCards(cards) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cards))
  } catch (error) {
    console.error('Failed to save PECS cards:', error)
  }
}

/**
 * Add a new PECS card
 */
export function addPecsCard(card) {
  return loadPecsCards().then((cards) => {
    cards.push(card)
    savePecsCards(cards)
    return cards
  })
}

/**
 * Update an existing PECS card
 */
export function updatePecsCard(cardId, updates) {
  return loadPecsCards().then((cards) => {
    const index = cards.findIndex((c) => c.id === cardId)
    if (index !== -1) {
      cards[index] = { ...cards[index], ...updates }
      savePecsCards(cards)
    }
    return cards
  })
}

/**
 * Delete a PECS card
 */
export function deletePecsCard(cardId) {
  return loadPecsCards().then((cards) => {
    const filtered = cards.filter((c) => c.id !== cardId)
    savePecsCards(filtered)
    return filtered
  })
}

/**
 * Save board state (arrangement of cards)
 */
export function saveBoardState(state) {
  try {
    localStorage.setItem(BOARD_STATE_KEY, JSON.stringify(state))
  } catch (error) {
    console.error('Failed to save board state:', error)
  }
}

/**
 * Load board state
 */
export function loadBoardState() {
  try {
    const stored = localStorage.getItem(BOARD_STATE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch (error) {
    console.error('Failed to load board state:', error)
    return []
  }
}
