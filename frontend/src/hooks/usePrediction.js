import { useCallback, useState } from 'react'
import axios from 'axios'
import { analyzeRiceLeaves } from '../services/api'

function getErrorMessage(error) {
  if (axios.isAxiosError(error)) {
    if (error.response?.data?.detail) return error.response.data.detail
    if (error.code === 'ECONNABORTED') return 'Analysis took too long. Please try again.'
    if (!error.response) return 'Cannot reach the analysis server. Make sure the backend is running.'
  }
  return 'Something went wrong while analyzing the image.'
}

export default function usePrediction() {
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  const analyze = useCallback(async (files) => {
    setIsLoading(true)
    setError('')
    setResult(null)
    setUploadProgress(0)

    try {
      const prediction = await analyzeRiceLeaves(files, (event) => {
        if (event.total) setUploadProgress(Math.round((event.loaded * 100) / event.total))
      })
      setResult(prediction)
      return prediction
    } catch (requestError) {
      setError(getErrorMessage(requestError))
      return null
    } finally {
      setIsLoading(false)
    }
  }, [])

  const reset = useCallback(() => {
    setResult(null)
    setError('')
    setUploadProgress(0)
  }, [])

  return { result, error, isLoading, uploadProgress, analyze, reset, setError }
}
