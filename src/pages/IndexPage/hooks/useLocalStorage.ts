export function saveToStorage(key: string, value: string) {
  localStorage.setItem(key, value);
}

export function loadFromStorage(key: string): string | null {
  return localStorage.getItem(key);
}

export function loadNumber(key: string, fallback = 0): number {
  const v = localStorage.getItem(key);
  return v ? parseInt(v, 10) : fallback;
}

export function clearAllStorage() {
  localStorage.clear();
}