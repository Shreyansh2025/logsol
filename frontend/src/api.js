import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
})

export const searchMaterials     = (text, top_k = 5) => api.post('/search', { text, top_k })
export const explainMatch        = (index_a, index_b) => api.post('/match/explain', { index_a, index_b })
export const classifyNewMaterial = (text) => api.post('/national-code/new', { text })
export const sendFeedback        = (payload) => api.post('/feedback', payload)
export const getDashboardStats   = () => api.get('/dashboard/stats')
export const getCatalog          = (limit = 100, offset = 0) => api.get(`/catalog?limit=${limit}&offset=${offset}`)
