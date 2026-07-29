/**
 * LocalStorage utilities for PECS cards management
 */

const STORAGE_KEY = 'pecs_cards'
const BOARD_STATE_KEY = 'pecs_board_state'

const normalizeCards = (cards) =>
  cards.map((card) => ({
    ...card,
    active: card.active !== false
  }))

/**
 * Load PECS cards from LocalStorage or fetch from static file
 */
export async function loadPecsCards() {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored) {
    try {
      const cards = JSON.parse(stored)
      return normalizeCards(cards)
    } catch (error) {
      console.error('Failed to parse stored cards:', error)
    }
  }

  const tryFetch = async (path) => {
    const response = await fetch(path)
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
    const cards = await response.json()
    return normalizeCards(cards)
  }

  try {
    const cards = await tryFetch('/data/PECS.cards')
    savePecsCards(cards)
    return cards
  } catch (firstError) {
    try {
      const cards = await tryFetch('/data/PECS.cards.json')
      savePecsCards(cards)
      return cards
    } catch (secondError) {
      console.error('Failed to load PECS cards:', firstError, secondError)
      return []
    }
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
    const cardWithActive = { ...card, active: card.active !== false }
    cards.push(cardWithActive)
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
    return normalizeCards(cards)
  })
}

/**
 * Delete a PECS card
 */
export function deletePecsCard(cardId) {
  return loadPecsCards().then((cards) => {
    const filtered = cards.filter((c) => c.id !== cardId)
    savePecsCards(filtered)
    return normalizeCards(filtered)
  })
}

/**
 * Save board state (array of card ids)
 */
export function saveBoardState(state) {
  try {
    localStorage.setItem(BOARD_STATE_KEY, JSON.stringify(state))
  } catch (error) {
    console.error('Failed to save board state:', error)
  }
}

/**
 * Load board state (return array of card ids)
 */
export function loadBoardState() {
  try {
    const stored = localStorage.getItem(BOARD_STATE_KEY)
    if (!stored) return []

    const parsed = JSON.parse(stored)
    if (!Array.isArray(parsed)) return []
    return parsed.map((item) => {
      if (item && typeof item === 'object' && 'id' in item) {
        return item.id
      }
      return item
    }).filter((id) => typeof id === 'string')
  } catch (error) {
    console.error('Failed to load board state:', error)
    return []
  }
}
