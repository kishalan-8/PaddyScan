import { Cloud, CloudDrizzle, CloudFog, CloudLightning, CloudRain, CloudSun, Moon, Sun } from 'lucide-react'

export function getWeatherCondition(code, isDay = true) {
  if (code === 1000) return { label: 'Clear sky', Icon: isDay ? Sun : Moon, tone: 'clear' }
  if (code === 1003) return { label: 'Partly cloudy', Icon: CloudSun, tone: 'mild' }
  if ([1006, 1009].includes(code)) return { label: 'Cloudy', Icon: Cloud, tone: 'cloud' }
  if ([1030, 1135, 1147].includes(code)) return { label: 'Misty', Icon: CloudFog, tone: 'mist' }
  if ([1063, 1150, 1153, 1168, 1171, 1180, 1183].includes(code)) {
    return { label: 'Drizzle', Icon: CloudDrizzle, tone: 'rain' }
  }
  if ([1087, 1273, 1276, 1279, 1282].includes(code)) {
    return { label: 'Thunderstorms', Icon: CloudLightning, tone: 'storm' }
  }
  if ([1066, 1069, 1072, 1114, 1117, 1204, 1207, 1210, 1213, 1216, 1219, 1222, 1225, 1237, 1249, 1252, 1255, 1258, 1261, 1264].includes(code)) {
    return { label: 'Wintry weather', Icon: CloudRain, tone: 'rain' }
  }
  if ([1186, 1189, 1192, 1195, 1198, 1201, 1240, 1243, 1246].includes(code)) {
    return { label: 'Rain', Icon: CloudRain, tone: 'rain' }
  }
  return { label: 'Cloudy', Icon: Cloud, tone: 'cloud' }
}
