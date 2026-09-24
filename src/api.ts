const API_BASE = (import.meta.env.VITE_API_URL || "https://api.vadindia.com/api").replace(/\/$/, "")
const TOKEN_KEY = "vadi_admin_token"

export type AdminUser = {
  id: string
  phone: string
  role: "farmer" | "dealer" | "admin"
  isProfileCompleted: boolean
  isBlocked: boolean
  isGrowthPartner: boolean
  lastActiveAt: string | null
  createdAt: string
  profile: {
    name: string
    district: string
    taluka: string
    village: string
    profileImage?: string | null
  } | null
}

export type DashboardData = {
  metrics: {
    totalUsers: number
    farmers: number
    dealers: number
    listings: number
    feedPosts: number
    dealerBills: number
    blockedUsers: number
    pendingReports: number
  }
  growth: Array<{ date: string; users: number; farmers: number; dealers: number }>
  recentUsers: AdminUser[]
}

export type PaginatedUsers = {
  data: AdminUser[]
  pagination: { page: number; limit: number; total: number; pages: number }
}

export const session = {
  get: () => localStorage.getItem(TOKEN_KEY),
  save: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
}

async function request<T>(path: string, options: RequestInit & { auth?: boolean } = {}): Promise<T> {
  const { auth = true, headers, ...rest } = options
  const response = await fetch(`${API_BASE}${path}`, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...(auth && session.get() ? { Authorization: `Bearer ${session.get()}` } : {}),
      ...(headers || {}),
    },
  })
  const body = await response.json().catch(() => null)
  if (!response.ok) {
    if (response.status === 401 && auth) session.clear()
    throw new Error(body?.message || body?.error || "Something went wrong")
  }
  return body as T
}

export async function sendOtp(phone: string) {
  return request<{ sessionId: string }>("/auth/send-otp", {
    method: "POST",
    auth: false,
    body: JSON.stringify({ phone }),
  })
}

export async function verifyOtp(phone: string, otp: string, sessionId: string) {
  const result = await request<{ token: string }>("/auth/verify-otp", {
    method: "POST",
    auth: false,
    body: JSON.stringify({ phone, otp, sessionId }),
  })
  session.save(result.token)
  return getMe()
}

export async function getMe() {
  const result = await request<{ user: { _id: string; phone: string; role: string; isAdmin?: boolean } }>("/auth/me")
  return result.user
}

export async function getDashboard() {
  const result = await request<{ data: DashboardData }>("/admin/dashboard")
  return result.data
}

export async function getUsers(params: {
  page?: number
  search?: string
  role?: string
  status?: string
}) {
  const query = new URLSearchParams()
  query.set("page", String(params.page || 1))
  query.set("limit", "20")
  if (params.search) query.set("search", params.search)
  if (params.role && params.role !== "all") query.set("role", params.role)
  if (params.status && params.status !== "all") query.set("status", params.status)
  return request<PaginatedUsers>(`/admin/users?${query}`)
}

export async function updateUser(id: string, payload: { isBlocked?: boolean; role?: string; reason?: string }) {
  const result = await request<{ data: AdminUser }>(`/admin/users/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  })
  return result.data
}

export async function getReports(status = "pending") {
  return request<{ data: Array<Record<string, unknown>>; pagination: { total: number } }>(
    `/moderation/reports?status=${status}&page=1&limit=50`,
  )
}

export async function updateReport(id: string, status: "resolved" | "dismissed") {
  return request(`/moderation/reports/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  })
}

export async function getPendingListings() {
  return request<{ data: Array<Record<string, unknown>>; pagination: { total: number } }>(
    "/farm-sell/admin/pending?page=1&limit=50",
  )
}

export async function moderateListing(id: string, status: "approved" | "rejected", rejectionReason?: string) {
  return request(`/farm-sell/admin/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ status, rejectionReason }),
  })
}

export async function sendBroadcast(payload: { title: string; body: string }) {
  return request<{ message?: string; sent?: number }>("/push/send", {
    method: "POST",
    body: JSON.stringify({ ...payload, sendToAll: true, saveInApp: true }),
  })
}

