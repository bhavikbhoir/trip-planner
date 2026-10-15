// Weather data from the backend is always Fahrenheit (OpenWeatherMap is
// always queried with units=imperial) — conversion happens here, per
// viewer, so two members of the same trip can each see their own preferred
// unit on the same shared weather data instead of the backend having to
// know or care who's asking.
export function convertTemp(fahrenheit, unit) {
  if (fahrenheit == null) return null
  return unit === 'metric' ? Math.round(((fahrenheit - 32) * 5) / 9) : Math.round(fahrenheit)
}

export function fmtTemp(fahrenheit, unit) {
  const v = convertTemp(fahrenheit, unit)
  return v == null ? '' : `${v}°${unit === 'metric' ? 'C' : 'F'}`
}
