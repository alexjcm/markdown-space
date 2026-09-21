export function formatDateTime(timestamp: number): string {
  const date = new Date(timestamp)
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  const hours24 = date.getHours()
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const period = hours24 >= 12 ? 'PM' : 'AM'
  const hours12 = String(hours24 % 12 || 12).padStart(2, '0')
  return `${day}/${month}/${year}, ${hours12}:${minutes} ${period}`
}
