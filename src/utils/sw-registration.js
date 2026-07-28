/**
 * Register Service Worker for PWA functionality
 */
export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    console.log('Service Workers not supported')
    return
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/'
    })
    console.log('Service Worker registered:', registration)
  } catch (error) {
    console.error('Service Worker registration failed:', error)
  }
}

/**
 * Check if app is running in PWA mode
 */
export function isPWAMode() {
  return window.matchMedia('(display-mode: standalone)').matches ||
    navigator.standalone === true ||
    window.navigator.standalone === true
}
