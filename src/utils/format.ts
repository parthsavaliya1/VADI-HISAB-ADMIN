import type { AdminUser } from "../api"

export function money(value: number) {
  return `₹${value.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`
}

export function nameOf(user: AdminUser) {
  return user.profile?.name || "VADI User"
}

export function formatDate(value?: string | null) {
  if (!value) return "—"
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value))
}

export function localIso(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${date.getFullYear()}-${month}-${day}`
}

export function isoDaysAgo(days: number) {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return localIso(date)
}

export function todayIso() {
  return localIso(new Date())
}

export function percentChange(current: number, previous: number) {
  if (!previous) return current ? 100 : 0
  return ((current - previous) / previous) * 100
}

export function trendText(value: number) {
  const sign = value > 0 ? "+" : ""
  return `${sign}${value.toFixed(1)}% vs last month`
}

export function monthLabel(month: string) {
  const [year, mon] = month.split("-").map(Number)
  if (!year || !mon) return month
  return new Date(year, mon - 1, 1).toLocaleDateString("en-IN", { month: "short" })
}

export function timeAgo(value?: string | null) {
  if (!value) return ""
  const minutes = Math.round((Date.now() - new Date(value).getTime()) / 60000)
  if (Number.isNaN(minutes)) return ""
  if (minutes < 1) return "just now"
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`
  const days = Math.round(hours / 24)
  if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`
  return formatDate(value)
}
