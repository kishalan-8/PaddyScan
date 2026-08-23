import api from './api'

export async function getHistory(page = 1) {
  const response = await api.get('/history', { params: { page, limit: 12 } })
  return response.data
}

export async function deleteDetection(id) {
  await api.delete(`/history/${id}`)
}

export async function addFarmerNote(detectionId, text) {
  const response = await api.post(`/history/${detectionId}/notes`, { text })
  return response.data
}

export async function updateFarmerNote(detectionId, noteId, text) {
  const response = await api.patch(`/history/${detectionId}/notes/${noteId}`, { text })
  return response.data
}

export async function deleteFarmerNote(detectionId, noteId) {
  await api.delete(`/history/${detectionId}/notes/${noteId}`)
}
