import {
  AlertCircle,
  ArrowUpRight,
  CloudRain,
  Compass,
  Droplets,
  Eye,
  Gauge,
  Leaf,
  LocateFixed,
  MapPin,
  Navigation,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Sunrise,
  Sunset,
  ThermometerSun,
  Wind,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import WeatherGlyph from '../components/WeatherGlyph'
import useWeather from '../hooks/useWeather'
import { getWeatherCondition } from '../utils/weatherCondition'

function clockLabel(value) {
  if (!value) return '—'
  if (/\b(?:AM|PM)$/i.test(value)) return value.toLowerCase().replace(':00', '')
  const time = value.includes(' ') ? value.split(' ')[1] : value.slice(11, 16)
  const [hours = '0', minutes = '00'] = time.split(':')
  const hour = Number(hours)
  const suffix = hour < 12 ? 'am' : 'pm'
  const normalized = hour % 12 || 12
  return minutes === '00' ? `${normalized} ${suffix}` : `${normalized}:${minutes} ${suffix}`
}

function dayLabel(value) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('en', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  }).format(new Date(`${value}T12:00:00`))
}

function futureHours(weather, count = 12) {
  if (!weather?.forecastDays?.length) return []
  const currentEpoch = weather.current.lastUpdatedEpoch || 0
  return weather.forecastDays
    .flatMap((day) => day.hours)
    .filter((hour) => hour.epoch >= currentEpoch)
    .slice(0, count)
}

function fieldBriefing(weather, hours) {
  if (!weather?.current || !hours.length) return null
  const nextEight = hours.slice(0, 8)
  const nextSix = hours.slice(0, 6)
  const humidHours = nextEight.filter((hour) => hour.humidity >= 85).length
  const peakRain = Math.max(...nextEight.map((hour) => hour.rainChance || 0))
  const peakGust = Math.max(...nextEight.map((hour) => hour.gustKph || 0))
  const workableHours = nextSix.filter((hour) => hour.rainChance < 30 && hour.windKph < 15).length
  const firstRain = hours.find((hour) => hour.rainChance >= 55 || hour.precipitationMm > 0.5)
  const pressure = (humidHours * 9) + (peakRain * 0.45) + Math.max(0, peakGust - 25)
  const score = Math.max(18, Math.min(96, Math.round(100 - pressure)))

  return {
    score,
    label: score >= 72 ? 'Good field window' : score >= 45 ? 'Plan with care' : 'Conditions unsettled',
    nextRain: firstRain ? clockLabel(firstRain.time) : 'Not in 12 hours',
    humidHours,
    peakRain,
    workableHours,
    signals: [
      {
        icon: Droplets,
        title: humidHours >= 4 ? 'Extended leaf moisture' : 'Humidity easing',
        text: humidHours >= 4
          ? `${humidHours} of the next 8 hours may stay above 85% humidity.`
          : 'Prolonged high humidity is not expected in the next 8 hours.',
        tone: humidHours >= 4 ? 'watch' : 'good',
      },
      {
        icon: CloudRain,
        title: peakRain >= 60 ? 'Rain interruption likely' : 'Lower rain pressure',
        text: `Rain probability peaks at ${peakRain}% in the short-term outlook.`,
        tone: peakRain >= 60 ? 'watch' : 'good',
      },
      {
        icon: Wind,
        title: workableHours >= 3 ? 'Useful field window' : 'Limited field window',
        text: `${workableHours} of the next 6 hours pair gentler wind with lower rain chance.`,
        tone: workableHours >= 3 ? 'good' : 'neutral',
      },
    ],
  }
}

function LoadingWeather() {
  return (
    <div className="weather-loading" aria-live="polite">
      <div className="weather-loading-orb"><LocateFixed size={30} /></div>
      <p className="eyebrow">Reading local conditions</p>
      <h1>Finding your field weather…</h1>
      <p>Allow location access when prompted, or search for your nearest town.</p>
    </div>
  )
}

function PlaceControls({
  searchOpen,
  setSearchOpen,
  query,
  setQuery,
  submitSearch,
  isSearching,
  searchResults,
  selectPlace,
  locateUser,
  clearSearch,
}) {
  return (
    <div className="relative z-30 flex flex-wrap gap-2">
      <button type="button" className="weather-location-button" onClick={locateUser}>
        <LocateFixed size={16} /> Use my location
      </button>
      <button
        type="button"
        className="weather-location-button"
        aria-expanded={searchOpen}
        onClick={() => {
          setSearchOpen((open) => !open)
          clearSearch()
        }}
      >
        <Search size={16} /> Search place
      </button>
      {searchOpen && (
        <div className="weather-search-panel">
          <form onSubmit={submitSearch} className="flex gap-2">
            <label className="sr-only" htmlFor="weather-place">Town or district</label>
            <input
              id="weather-place"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Town or district"
              autoFocus
            />
            <button type="submit" disabled={query.trim().length < 2 || isSearching} aria-label="Search">
              {isSearching ? <RefreshCw className="animate-spin" size={17} /> : <Search size={17} />}
            </button>
          </form>
          {searchResults.length > 0 && (
            <div className="mt-3 border-t border-ink/10 pt-2">
              {searchResults.map((place) => (
                <button
                  key={`${place.latitude}-${place.longitude}`}
                  type="button"
                  className="weather-search-result"
                  onClick={() => selectPlace(place)}
                >
                  <MapPin size={15} />
                  <span><strong>{place.name}</strong><small>{place.detail}</small></span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function WeatherPage() {
  const {
    location,
    weather,
    status,
    error,
    searchResults,
    isSearching,
    chooseLocation,
    findPlaces,
    locateUser,
    refresh,
    clearSearch,
  } = useWeather()
  const [query, setQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const hours = useMemo(() => futureHours(weather), [weather])
  const briefing = useMemo(() => fieldBriefing(weather, hours), [weather, hours])

  function submitSearch(event) {
    event.preventDefault()
    findPlaces(query)
  }

  function selectPlace(place) {
    chooseLocation(place)
    setQuery('')
    setSearchOpen(false)
  }

  const current = weather?.current
  const condition = current
    ? { ...getWeatherCondition(current.condition.code, current.isDay), label: current.condition.text }
    : null
  const today = weather?.forecastDays?.[0]

  const controls = (
    <PlaceControls
      searchOpen={searchOpen}
      setSearchOpen={setSearchOpen}
      query={query}
      setQuery={setQuery}
      submitSearch={submitSearch}
      isSearching={isSearching}
      searchResults={searchResults}
      selectPlace={selectPlace}
      locateUser={locateUser}
      clearSearch={clearSearch}
    />
  )

  return (
    <section className="weather-page weather-page-v2 px-5 py-10 sm:px-8 sm:py-14">
      <div className="mx-auto max-w-6xl">
        <div className="weather-page-heading">
          <div>
            <div className="weather-live-label"><span /> Weather intelligence</div>
            <h1>Know the next move<br className="hidden sm:block" /> for your field.</h1>
            <p>Live local conditions shaped into a practical crop-work briefing.</p>
          </div>
          {controls}
        </div>

        {error && (
          <div className="mb-5 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900" role="alert">
            <AlertCircle className="mt-0.5 shrink-0" size={17} />
            <span>{error}</span>
          </div>
        )}

        {!weather && (status === 'loading' || status === 'locating') ? (
          <LoadingWeather />
        ) : !weather ? (
          <div className="weather-empty">
            <MapPin size={28} />
            <h2>Choose a location to see field weather</h2>
            <p>Use your device location or search for a nearby town.</p>
            <button type="button" className="primary-button mt-5" onClick={locateUser}>
              <Navigation size={16} /> Detect my location
            </button>
          </div>
        ) : (
          <>
            {weather.alerts.length > 0 && (
              <div className="weather-alert-strip">
                <AlertCircle size={18} />
                <div><strong>{weather.alerts[0].event || 'Weather advisory'}</strong><span>{weather.alerts[0].headline}</span></div>
              </div>
            )}

            <article className={`weather-dashboard weather-tone-${condition.tone}`}>
              <div className="weather-dashboard-light" aria-hidden="true" />
              <header className="weather-dashboard-header">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="weather-pin"><MapPin size={17} /></span>
                  <div className="min-w-0">
                    <h2>{weather.location.name || location?.name}</h2>
                    <p>{[weather.location.region, weather.location.country].filter(Boolean).join(', ') || location?.detail}</p>
                  </div>
                </div>
                <button type="button" className="weather-refresh" onClick={refresh} aria-label="Refresh weather">
                  <RefreshCw size={15} /> <span>Observed {clockLabel(current.lastUpdated)}</span>
                </button>
              </header>

              <div className="weather-dashboard-body">
                <div className="weather-now">
                  <div className="weather-now-glyph"><WeatherGlyph code={current.condition.code} isDay={current.isDay} size={62} /></div>
                  <div>
                    <p>{condition.label}</p>
                    <div className="weather-temperature"><strong>{Math.round(current.temperatureC)}</strong><span>°C</span></div>
                    <small>Feels like {Math.round(current.feelsLikeC)}° · {today.summary.minC.toFixed(0)}° / {today.summary.maxC.toFixed(0)}°</small>
                  </div>
                </div>

                <div className="field-readiness">
                  <div className="field-score" style={{ '--score': `${briefing.score * 3.6}deg` }}>
                    <div><strong>{briefing.score}</strong><span>field score</span></div>
                  </div>
                  <div>
                    <p>Current outlook</p>
                    <h3>{briefing.label}</h3>
                    <span>Next meaningful rain: <strong>{briefing.nextRain}</strong></span>
                  </div>
                </div>
              </div>

              <div className="weather-dashboard-metrics">
                <div><Droplets /><span>Humidity</span><strong>{current.humidity}%</strong></div>
                <div><CloudRain /><span>Rain now</span><strong>{current.precipitationMm} mm</strong></div>
                <div><Wind /><span>Wind</span><strong>{Math.round(current.windKph)} km/h</strong></div>
                <div><Eye /><span>Visibility</span><strong>{current.visibilityKm} km</strong></div>
                <div><ThermometerSun /><span>UV index</span><strong>{current.uv}</strong></div>
                <div><Gauge /><span>Pressure</span><strong>{Math.round(current.pressureMb)} mb</strong></div>
              </div>

              <footer className="weather-dashboard-footer">
                <span><Sunrise size={15} /> {today.astro.sunrise.toLowerCase()}</span>
                <span><Sunset size={15} /> {today.astro.sunset.toLowerCase()}</span>
                <span><Compass size={15} /> Wind {current.windDirection}</span>
                <span className="ml-auto"><ShieldCheck size={15} /> Refreshes every 10 min</span>
              </footer>
            </article>

            <section className="weather-section-v2">
              <div className="weather-section-heading">
                <div><p>Hour by hour</p><h2>Read the weather window</h2></div>
                <span>Rain probability shown below each hour</span>
              </div>
              <div className="weather-hourly-v2" role="list" aria-label="Hourly weather forecast">
                {hours.map((hour, index) => (
                  <article key={hour.epoch} className={index === 0 ? 'is-now' : ''} role="listitem">
                    <time>{index === 0 ? 'Now' : clockLabel(hour.time)}</time>
                    <WeatherGlyph code={hour.condition.code} isDay={hour.isDay} size={26} />
                    <strong>{Math.round(hour.temperatureC)}°</strong>
                    <div className="hour-rain-track"><i style={{ height: `${Math.max(5, hour.rainChance)}%` }} /></div>
                    <span>{hour.rainChance}%</span>
                  </article>
                ))}
              </div>
            </section>

            <section className="weather-insight-grid">
              <article className="rain-rhythm-card">
                <div className="weather-section-heading compact">
                  <div><p>Rain rhythm</p><h2>Next 12 hours</h2></div>
                  <CloudRain size={21} />
                </div>
                <div className="rain-bars" aria-label="Hourly rain probability chart">
                  {hours.map((hour) => (
                    <div key={hour.epoch} title={`${clockLabel(hour.time)}: ${hour.rainChance}%`}>
                      <i style={{ height: `${Math.max(4, hour.rainChance)}%` }} />
                      <span>{clockLabel(hour.time).replace(' ', '')}</span>
                    </div>
                  ))}
                </div>
                <div className="rain-summary">
                  <div><span>Peak probability</span><strong>{briefing.peakRain}%</strong></div>
                  <div><span>Next rain signal</span><strong>{briefing.nextRain}</strong></div>
                  <div><span>Potential work hours</span><strong>{briefing.workableHours} / 6</strong></div>
                </div>
              </article>

              <article className="field-briefing-card">
                <div className="weather-section-heading compact">
                  <div><p>Field briefing</p><h2>What matters now</h2></div>
                  <Sparkles size={20} />
                </div>
                <div className="field-briefing-list">
                  {briefing.signals.map(({ icon: Icon, title, text, tone }) => (
                    <div key={title} className={`field-briefing-item tone-${tone}`}>
                      <span><Icon size={17} /></span>
                      <div><h3>{title}</h3><p>{text}</p></div>
                    </div>
                  ))}
                </div>
              </article>
            </section>

            <section className="weather-section-v2 weather-days-section">
              <div className="weather-section-heading">
                <div><p>Three-day outlook</p><h2>Plan beyond today</h2></div>
                <Leaf size={20} />
              </div>
              <div className="weather-days-grid">
                {weather.forecastDays.map((day, index) => (
                  <article key={day.date}>
                    <div>
                      <p>{index === 0 ? 'Today' : dayLabel(day.date)}</p>
                      <span>{day.summary.condition.text}</span>
                    </div>
                    <WeatherGlyph code={day.summary.condition.code} size={30} />
                    <strong>{Math.round(day.summary.maxC)}° <small>{Math.round(day.summary.minC)}°</small></strong>
                    <div className="day-rain"><CloudRain size={13} /> {day.summary.rainChance}%</div>
                    <ArrowUpRight size={16} />
                  </article>
                ))}
              </div>
            </section>

            <p className="weather-disclaimer">
              Field scores are simple planning cues derived from humidity, rain and wind—not disease forecasts or treatment advice. Data by WeatherAPI.com.
            </p>
          </>
        )}
      </div>
    </section>
  )
}
