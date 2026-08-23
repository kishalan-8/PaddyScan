import axios from 'axios'
import api from './api'

function weatherError(error, fallback) {
  if (axios.isAxiosError(error) && error.response?.data?.detail) {
    return new Error(error.response.data.detail)
  }
  return new Error(fallback)
}

export async function getWeather(latitude, longitude, signal) {
  try {
    const response = await api.get('/weather', {
      params: { latitude, longitude },
      signal,
    })
    return response.data
  } catch (error) {
    if (error.name === 'CanceledError') throw error
    throw weatherError(error, 'Weather data is temporarily unavailable.')
  }
}

export async function searchPlaces(query, signal) {
  try {
    const response = await api.get('/weather/locations', {
      params: { query: query.trim() },
      signal,
    })
    return response.data
  } catch (error) {
    if (error.name === 'CanceledError') throw error
    throw weatherError(error, 'Place search is temporarily unavailable.')
  }
}
