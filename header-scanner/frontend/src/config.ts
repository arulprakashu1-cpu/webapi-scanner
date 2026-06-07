export const PRO_URL = import.meta.env.VITE_PRO_URL || 'http://localhost:5173'
// Empty string in production = same-origin (backend serves frontend). ?? not || so '' stays ''
export const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8001'
