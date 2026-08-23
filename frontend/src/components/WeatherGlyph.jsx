import { getWeatherCondition } from '../utils/weatherCondition'

export default function WeatherGlyph({ code, isDay = true, size = 32, className = '' }) {
  const { Icon, label } = getWeatherCondition(code, isDay)
  return <Icon size={size} className={className} aria-label={label} />
}
