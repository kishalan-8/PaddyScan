import { useCallback, useEffect, useRef, useState } from 'react'
import { getWeather, searchPlaces } from '../services/weather'

const REFRESH_INTERVAL = 10 * 60 * 1000
const SAVED_LOCATION_KEY = 'paddyscan-weather-location'

function readSavedLocation() {
  try {
    return JSON.parse(window.localStorage.getItem(SAVED_LOCATION_KEY))
  } catch {
    return null
  }
}

function saveLocation(location) {
  try {
    window.localStorage.setItem(SAVED_LOCATION_KEY, JSON.stringify(location))
  } catch {
    // Weather still works when storage is blocked.
  }
}

function geolocationMessage(error) {
  if (error?.code === 1) return 'Location access was not allowed. Search for your nearest town instead.'
  if (error?.code === 2) return 'Your device could not determine its location. Try searching for a town.'
  if (error?.code === 3) return 'Location detection took too long. Try again or search for a town.'
  return 'Your location could not be detected.'
}

export default function useWeather() {
  const [location, setLocation] = useState(readSavedLocation)
  const [weather, setWeather] = useState(null)
  const [status, setStatus] = useState(location ? 'loading' : 'locating')
  const [error, setError] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const requestRef = useRef(null)

  const loadWeather = useCallback(async (target, quiet = false) => {
    requestRef.current?.abort()
    const controller = new AbortController()
    requestRef.current = controller
    if (!quiet) setStatus('loading')
    setError('')

    try {
      const data = await getWeather(target.latitude, target.longitude, controller.signal)
      setWeather(data)
      setStatus('ready')
    } catch (requestError) {
      if (requestError.name === 'AbortError' || requestError.name === 'CanceledError') return
      setError(requestError.message || 'Weather data could not be loaded.')
      setStatus((currentStatus) => currentStatus === 'ready' ? 'ready' : 'error')
    }
  }, [])

  const chooseLocation = useCallback((nextLocation) => {
    const normalized = {
      name: nextLocation.name,
      detail: nextLocation.detail || '',
      latitude: Number(nextLocation.latitude),
      longitude: Number(nextLocation.longitude),
    }
    saveLocation(normalized)
    setLocation(normalized)
    setSearchResults([])
  }, [])

  const locateUser = useCallback(() => {
    if (!navigator.geolocation) {
      setStatus('error')
      setError('This browser does not support location detection. Search for your town instead.')
      return
    }

    setStatus('locating')
    setError('')
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => chooseLocation({
        name: 'Current field',
        detail: `${coords.latitude.toFixed(3)}, ${coords.longitude.toFixed(3)}`,
        latitude: coords.latitude,
        longitude: coords.longitude,
      }),
      (locationError) => {
        setStatus((currentStatus) => currentStatus === 'ready' ? 'ready' : 'error')
        setError(geolocationMessage(locationError))
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 5 * 60 * 1000 },
    )
  }, [chooseLocation])

  const findPlaces = useCallback(async (query) => {
    if (query.trim().length < 2) {
      setSearchResults([])
      return
    }
    setIsSearching(true)
    setError('')
    try {
      const results = await searchPlaces(query)
      setSearchResults(results)
      if (!results.length) setError('No matching place was found. Try a nearby town or district.')
    } catch (searchError) {
      setError(searchError.message || 'Place search could not be completed.')
    } finally {
      setIsSearching(false)
    }
  }, [])

  useEffect(() => {
    if (!location) {
      locateUser()
      return undefined
    }

    loadWeather(location)
    const interval = window.setInterval(() => loadWeather(location, true), REFRESH_INTERVAL)
    return () => {
      window.clearInterval(interval)
      requestRef.current?.abort()
    }
  }, [loadWeather, locateUser, location])

  return {
    location,
    weather,
    status,
    error,
    searchResults,
    isSearching,
    chooseLocation,
    findPlaces,
    locateUser,
    refresh: () => location && loadWeather(location, true),
    clearSearch: () => setSearchResults([]),
  }
}
