const formatter = new Intl.RelativeTimeFormat('es', { numeric: 'auto' })

const UNITS: { unit: Intl.RelativeTimeFormatUnit; ms: number }[] = [
  { unit: 'year', ms: 1000 * 60 * 60 * 24 * 365 },
  { unit: 'month', ms: 1000 * 60 * 60 * 24 * 30 },
  { unit: 'day', ms: 1000 * 60 * 60 * 24 },
  { unit: 'hour', ms: 1000 * 60 * 60 },
  { unit: 'minute', ms: 1000 * 60 },
  { unit: 'second', ms: 1000 },
]

export function relativeTime(timestamp: number): string {
  const diff = timestamp - Date.now()
  const absDiff = Math.abs(diff)
  const match = UNITS.find(({ ms }) => absDiff >= ms) ?? UNITS[UNITS.length - 1]
  return formatter.format(Math.round(diff / match.ms), match.unit)
}
