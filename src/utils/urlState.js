export function encodeState(state) {
  try {
    const b64 = btoa(encodeURIComponent(JSON.stringify(state)))
    return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
  } catch {
    return null
  }
}

export function decodeState(str) {
  try {
    let b64 = str.replace(/-/g, '+').replace(/_/g, '/')
    while (b64.length % 4) b64 += '='
    return JSON.parse(decodeURIComponent(atob(b64)))
  } catch {
    return null
  }
}

export function readUrlState() {
  const hash = window.location.hash.slice(1)
  if (!hash) return null
  const params = new URLSearchParams(hash)
  const encoded = params.get('s')
  if (!encoded) return null
  return decodeState(encoded)
}

export function writeUrlState(state) {
  const encoded = encodeState(state)
  if (!encoded) return
  window.history.replaceState(null, '', '#s=' + encoded)
}
