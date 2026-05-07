declare global {
  interface Window {
    storage?: Storage
  }
}

function getBrowserStorage() {
  if (typeof window === "undefined") {
    return undefined
  }

  window.storage ??= window.localStorage

  return window.storage
}

export function readStoredJson<T>(key: string, fallback: T) {
  const storage = getBrowserStorage()

  if (!storage) {
    return fallback
  }

  const rawValue = storage.getItem(key)

  if (!rawValue) {
    return fallback
  }

  try {
    return JSON.parse(rawValue) as T
  } catch {
    return fallback
  }
}

export function writeStoredJson<T>(key: string, value: T) {
  const storage = getBrowserStorage()

  if (!storage) {
    return
  }

  storage.setItem(key, JSON.stringify(value))
}
