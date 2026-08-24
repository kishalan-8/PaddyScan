import axios from 'axios'
import api from './api'

function assistantError(error) {
  if (axios.isAxiosError(error) && error.response?.data?.detail) {
    return new Error(error.response.data.detail)
  }
  return new Error('The farming assistant is temporarily unavailable.')
}

export async function askFarmingAssistant(question, language, history) {
  try {
    const response = await api.post('/assistant/chat', { question, language, history })
    return response.data
  } catch (error) {
    throw assistantError(error)
  }
}

export async function getAssistantSources() {
  try {
    const response = await api.get('/assistant/sources')
    return response.data.sources
  } catch (error) {
    throw assistantError(error)
  }
}
