import axios from 'axios'

const api = axios.create({
  // Use the frontend origin in local development so the HttpOnly refresh
  // cookie is not lost when the app is opened as 127.0.0.1 instead of localhost.
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 120000,
  withCredentials: true,
})

let accessToken = ''
let refreshPromise = null

export function setAccessToken(token) {
  accessToken = token || ''
}

api.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config
    const canRefresh = error.response?.status === 401
      && original
      && !original._retried
      && !original.skipAuthRefresh
      && !original.url?.includes('/auth/login')
      && !original.url?.includes('/auth/signup')

    if (!canRefresh) throw error

    original._retried = true
    try {
      refreshPromise ||= api.post('/auth/refresh', null, { skipAuthRefresh: true })
      const response = await refreshPromise
      setAccessToken(response.data.accessToken)
      original.headers.Authorization = `Bearer ${response.data.accessToken}`
      return api(original)
    } catch (refreshError) {
      setAccessToken('')
      window.dispatchEvent(new Event('paddyscan:session-expired'))
      throw refreshError
    } finally {
      refreshPromise = null
    }
  },
)

export async function analyzeRiceLeaf(file, onUploadProgress) {
  const formData = new FormData()
  formData.append('file', file)

  const response = await api.post('/predict', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress,
  })
  return response.data
}

export default api
