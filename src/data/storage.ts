export function metaKb(): number {
  let bytes = 0
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (!key) continue
    const value = localStorage.getItem(key) ?? ''
    bytes += key.length + value.length
  }
  return bytes / 1024
}