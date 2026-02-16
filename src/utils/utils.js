export const MIN_BID = "0.01"

export function formatBNB(value) {
  const num = Number(value)
  if (isNaN(num)) return "0 BNB"
  if (num === 0) return "Sin pujas"
  if (num < 0.001) return "< 0.001 BNB"
  return `${num.toFixed(3)} BNB`
}

export function formatAddress(address) {
  if (address === "0x0000000000000000000000000000000000000000")
    return "Sin pujas"
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export function formatTimeRemaining(deadline) {
  // Los timestamps en solidity vienen en segundos y en Javascript en milisegundos
  const now = Math.floor(Date.now() / 1000)
  const remaining = deadline - now

  if (remaining <= 0) {
    return "Finalizada"
  }

  // 86400 = 24 horas/día * 60 minutos/hora * 60 segundos/minuto
  const days = Math.floor(remaining / 86400)
  const hours = Math.floor((remaining % 86400) / 3600)
  const minutes = Math.floor((remaining % 3600) / 60)
  const seconds = remaining % 60

  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`
  } else if (minutes > 0) {
    return `${minutes}m ${seconds}s`
  } else {
    return `${seconds}s`
  }
}

export function checkIsActive(deadline) {
  // Los timestamps en solidity vienen en segundos y en Javascript en milisegundos
  const now = Math.floor(Date.now() / 1000)
  const remaining = deadline - now

  if (remaining <= 0) {
    return false
  }
  return true
}
